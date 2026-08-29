<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\UploadedFile;

class TaskMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'taskable_type',
        'taskable_id',
        'user_id',
        'message',
        'attachment',
        'attachment_name',
    ];

    protected $with = ['user:id,name,email,avatar,type,employee_id'];

    public function taskable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

            $destinationPath = public_path('uploads/task_messages');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $originalName = $value->getClientOriginalName();
            $filename = time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['attachment'] = '/uploads/task_messages/' . $filename;
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
