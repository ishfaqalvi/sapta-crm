<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PDO;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DatabaseBackupController extends Controller
{
    /**
     * Backup directory inside storage/app.
     */
    protected string $backupDir;

    public function __construct()
    {
        $this->backupDir = storage_path('app/backups');
    }

    /**
     * Display a listing of existing database backups and database storage stats.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-database-backups') && !$user->can('view-database-backups'))) {
            abort(403, 'Unauthorized. You do not have permission to view database backups.');
        }

        if (!File::exists($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true, true);
        }

        $files = File::files($this->backupDir);
        $backups = [];
        $totalStorageBytes = 0;

        foreach ($files as $file) {
            $extension = strtolower($file->getExtension());
            if (!in_array($extension, ['sql', 'gz'])) {
                continue;
            }

            $sizeBytes = $file->getSize();
            $totalStorageBytes += $sizeBytes;
            $mtime = $file->getMTime();

            $backups[] = [
                'filename' => $file->getFilename(),
                'size_bytes' => $sizeBytes,
                'size_human' => $this->formatBytes($sizeBytes),
                'created_at' => Carbon::createFromTimestamp($mtime)->toISOString(),
                'created_at_human' => Carbon::createFromTimestamp($mtime)->diffForHumans(),
                'extension' => $extension,
            ];
        }

        // Sort latest backups first
        usort($backups, function ($a, $b) {
            return strtotime($b['created_at']) <=> strtotime($a['created_at']);
        });

        // Get database statistics
        $dbStats = $this->getDatabaseStats();

        $stats = [
            'total_backups' => count($backups),
            'total_storage_bytes' => $totalStorageBytes,
            'total_storage_human' => $this->formatBytes($totalStorageBytes),
            'last_backup_at' => count($backups) > 0 ? $backups[0]['created_at'] : null,
            'database_name' => $dbStats['database_name'],
            'database_size_bytes' => $dbStats['database_size_bytes'],
            'database_size_human' => $this->formatBytes($dbStats['database_size_bytes']),
            'total_tables' => $dbStats['total_tables'],
            'total_rows_estimate' => $dbStats['total_rows_estimate'],
            'mysql_version' => $dbStats['mysql_version'],
        ];

        return Inertia::render('database-backups/index', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Generate a new database backup dump.
     */
    public function create(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-database-backups') && !$user->can('create-database-backups'))) {
            abort(403, 'Unauthorized. You do not have permission to create database backups.');
        }

        if (!File::exists($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true, true);
        }

        // Prevent execution timeout on large databases
        @set_time_limit(600);
        @ini_set('memory_limit', '512M');

        $dbName = DB::connection()->getDatabaseName();
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_{$dbName}_{$timestamp}.sql";
        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;

        try {
            $this->generateSqlDump($filePath);

            $fileSize = File::size($filePath);
            $fileSizeHuman = $this->formatBytes($fileSize);

            return redirect()->route('database-backups.index')->with('success', "Database backup created successfully! [{$filename} - {$fileSizeHuman}]");
        } catch (Exception $e) {
            // Clean up partial file if failed
            if (File::exists($filePath)) {
                File::delete($filePath);
            }

            return redirect()->route('database-backups.index')->with('error', 'Failed to generate database backup: ' . $e->getMessage());
        }
    }

    /**
     * Download a specific backup file.
     */
    public function download(string $filename): BinaryFileResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('download-database-backups') && !$user->can('download-database-backups'))) {
            abort(403, 'Unauthorized. You do not have permission to download database backups.');
        }

        // Validate filename against path traversal
        if (basename($filename) !== $filename || !preg_match('/^[a-zA-Z0-9_\-\.]+\.(sql|gz)$/i', $filename)) {
            abort(400, 'Invalid backup filename.');
        }

        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;
        if (!File::exists($filePath)) {
            abort(404, 'Backup file not found.');
        }

        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    /**
     * Delete a specific backup file from storage.
     */
    public function destroy(string $filename): RedirectResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-database-backups') && !$user->can('delete-database-backups'))) {
            abort(403, 'Unauthorized. You do not have permission to delete database backups.');
        }

        if (basename($filename) !== $filename || !preg_match('/^[a-zA-Z0-9_\-\.]+\.(sql|gz)$/i', $filename)) {
            return redirect()->route('database-backups.index')->with('error', 'Invalid backup filename.');
        }

        $filePath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;
        if (!File::exists($filePath)) {
            return redirect()->route('database-backups.index')->with('error', 'Backup file not found.');
        }

        File::delete($filePath);

        return redirect()->route('database-backups.index')->with('success', 'Backup file deleted successfully.');
    }

    /**
     * Generate pure PHP PDO streaming SQL dump.
     */
    protected function generateSqlDump(string $targetFilePath): void
    {
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $handle = fopen($targetFilePath, 'w');
        if (!$handle) {
            throw new Exception("Unable to open file for writing: {$targetFilePath}");
        }

        $dbName = DB::connection()->getDatabaseName();
        $generatedAt = date('Y-m-d H:i:s');
        $mysqlVersion = $pdo->query('SELECT VERSION()')->fetchColumn();

        // Write SQL Header
        fwrite($handle, "-- ========================================================\n");
        fwrite($handle, "-- SAPTA CRM DATABASE DUMP\n");
        fwrite($handle, "-- Database: `{$dbName}`\n");
        fwrite($handle, "-- Generated At: {$generatedAt}\n");
        fwrite($handle, "-- MySQL / MariaDB Server Version: {$mysqlVersion}\n");
        fwrite($handle, "-- Application: Sapta CRM\n");
        fwrite($handle, "-- ========================================================\n\n");

        fwrite($handle, "SET NAMES utf8mb4;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n");
        fwrite($handle, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n");
        fwrite($handle, "SET AUTOCOMMIT = 0;\n");
        fwrite($handle, "START TRANSACTION;\n\n");

        // 1. Get all Base Tables
        $tablesStmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tables = [];
        while ($row = $tablesStmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        // 2. Export each table structure and data
        foreach ($tables as $table) {
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "-- Table structure for table `{$table}`\n");
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");

            $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
            $createRow = $createStmt->fetch(PDO::FETCH_ASSOC);
            $createTableSql = $createRow['Create Table'] ?? '';
            fwrite($handle, $createTableSql . ";\n\n");

            // Dump data
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
            $rowCount = (int) $countStmt->fetchColumn();

            if ($rowCount > 0) {
                fwrite($handle, "-- Dumping data for table `{$table}` ({$rowCount} rows)\n");

                $chunkSize = 200;
                $offset = 0;

                while ($offset < $rowCount) {
                    $selectStmt = $pdo->prepare("SELECT * FROM `{$table}` LIMIT :limit OFFSET :offset");
                    $selectStmt->bindValue(':limit', $chunkSize, PDO::PARAM_INT);
                    $selectStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                    $selectStmt->execute();

                    $rows = $selectStmt->fetchAll(PDO::FETCH_ASSOC);
                    if (empty($rows)) {
                        break;
                    }

                    $columns = array_keys($rows[0]);
                    $quotedCols = array_map(fn($col) => "`{$col}`", $columns);
                    $colsStr = implode(', ', $quotedCols);

                    $valueGroups = [];
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($row as $val) {
                            if (is_null($val)) {
                                $values[] = 'NULL';
                            } elseif (is_int($val) || is_float($val)) {
                                $values[] = $val;
                            } else {
                                $values[] = $pdo->quote($val);
                            }
                        }
                        $valueGroups[] = '(' . implode(', ', $values) . ')';
                    }

                    fwrite($handle, "INSERT INTO `{$table}` ({$colsStr}) VALUES\n" . implode(",\n", $valueGroups) . ";\n");

                    $offset += $chunkSize;
                }

                fwrite($handle, "\n");
            }
        }

        // 3. Get all Views
        $viewsStmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
        $views = [];
        while ($row = $viewsStmt->fetch(PDO::FETCH_NUM)) {
            $views[] = $row[0];
        }

        foreach ($views as $view) {
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "-- Structure for View `{$view}`\n");
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "DROP VIEW IF EXISTS `{$view}`;\n");

            $createStmt = $pdo->query("SHOW CREATE VIEW `{$view}`");
            $createRow = $createStmt->fetch(PDO::FETCH_ASSOC);
            $createViewSql = $createRow['Create View'] ?? '';
            fwrite($handle, $createViewSql . ";\n\n");
        }

        // Footer & Commit
        fwrite($handle, "COMMIT;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
        fwrite($handle, "-- Dump completed on {$generatedAt}\n");

        fclose($handle);
    }

    /**
     * Gather database sizing and table statistics.
     */
    protected function getDatabaseStats(): array
    {
        $dbName = DB::connection()->getDatabaseName();
        $dbSize = 0;
        $totalTables = 0;
        $totalRows = 0;
        $mysqlVersion = 'MySQL';

        try {
            $pdo = DB::connection()->getPdo();
            $mysqlVersion = $pdo->query('SELECT VERSION()')->fetchColumn();

            $statsQuery = DB::select("
                SELECT 
                    COUNT(table_name) AS table_count,
                    COALESCE(SUM(data_length + index_length), 0) AS total_bytes,
                    COALESCE(SUM(table_rows), 0) AS total_rows
                FROM information_schema.tables 
                WHERE table_schema = ?
            ", [$dbName]);

            if (!empty($statsQuery)) {
                $stat = $statsQuery[0];
                $totalTables = (int) ($stat->table_count ?? 0);
                $dbSize = (int) ($stat->total_bytes ?? 0);
                $totalRows = (int) ($stat->total_rows ?? 0);
            }
        } catch (Exception $e) {
            // Fallback if information_schema query fails
            $totalTables = count(DB::select('SHOW TABLES'));
        }

        return [
            'database_name' => $dbName,
            'database_size_bytes' => $dbSize,
            'total_tables' => $totalTables,
            'total_rows_estimate' => $totalRows,
            'mysql_version' => $mysqlVersion,
        ];
    }

    /**
     * Format bytes into human readable format (KB, MB, GB).
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
