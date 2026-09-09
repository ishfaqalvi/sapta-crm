<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;

class ProjectTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'website_project_id',
        'assigned_employee_id',
        'task_title',
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
        'start_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::deleting(function (ProjectTask $task) {
            $task->deleteOldAttachmentFile();
        });
    }

    public function websiteProject(): BelongsTo
    {
        return $this->belongsTo(WebsiteProject::class, 'website_project_id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(TaskMessage::class, 'taskable')->oldest();
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

            $destinationPath = public_path('uploads/project-tasks');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $originalName = $value->getClientOriginalName();
            $filename = time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['attachment'] = '/uploads/project-tasks/' . $filename;
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
