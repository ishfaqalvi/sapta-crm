<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('project_tasks')) {
            Schema::table('project_tasks', function (Blueprint $table) {
                if (!Schema::hasColumn('project_tasks', 'attachment')) {
                    $table->string('attachment')->nullable()->after('description');
                }
                if (!Schema::hasColumn('project_tasks', 'attachment_name')) {
                    $table->string('attachment_name')->nullable()->after('attachment');
                }
            });
        }

        if (Schema::hasTable('service_tasks')) {
            Schema::table('service_tasks', function (Blueprint $table) {
                if (!Schema::hasColumn('service_tasks', 'attachment')) {
                    $table->string('attachment')->nullable()->after('description');
                }
                if (!Schema::hasColumn('service_tasks', 'attachment_name')) {
                    $table->string('attachment_name')->nullable()->after('attachment');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('project_tasks')) {
            Schema::table('project_tasks', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('project_tasks', 'attachment_name')) {
                    $columns[] = 'attachment_name';
                }
                if (Schema::hasColumn('project_tasks', 'attachment')) {
                    $columns[] = 'attachment';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('service_tasks')) {
            Schema::table('service_tasks', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('service_tasks', 'attachment_name')) {
                    $columns[] = 'attachment_name';
                }
                if (Schema::hasColumn('service_tasks', 'attachment')) {
                    $columns[] = 'attachment';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
