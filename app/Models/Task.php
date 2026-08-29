<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_code',
        'task_title',
        'task_category_id',
        'assigned_employee_id',
        'created_by_user_id',
        'priority',
        'status',
        'start_date',
        'due_date',
        'description',
        'attachment',
        'attachment_name',
        'completed_at',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Task $task) {
            $task->deleteOldAttachmentFile();
        });
    }

    public function taskCategory(): BelongsTo
    {
        return $this->belongsTo(TaskCategory::class, 'task_category_id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(TaskMessage::class, 'taskable')->oldest();
    }

    /**
     * Auto-generate next task code (e.g. TSK-1001)
     */
    public static function generateTaskCode(): string
    {
        $latestId = self::max('id') ?? 0;
        return 'TSK-' . str_pad($latestId + 1, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Mutator for attachment attribute.
     */
    public function setAttachmentAttribute($value): void
    {
        if (is_null($value) || $value === '') {
            $this->deleteOldAttachmentFile();
            $this->attributes['attachment'] = null;
            $this->attributes['attachment_name'] = null;
            return;
        }

        if ($value instanceof UploadedFile && $value->isValid()) {
            $this->deleteOldAttachmentFile();

            $destinationPath = public_path('uploads/tasks');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $originalName = $value->getClientOriginalName();
            $filename = time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['attachment'] = '/uploads/tasks/' . $filename;
            $this->attributes['attachment_name'] = $originalName;
            return;
        }

        if (is_string($value)) {
            $this->attributes['attachment'] = $value;
        }
    }

    public function deleteOldAttachmentFile(): void
    {
        $oldPath = $this->getRawOriginal('attachment');
        if ($oldPath && file_exists(public_path($oldPath))) {
            @unlink(public_path($oldPath));
        }
    }
}
