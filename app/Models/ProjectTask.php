<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
        'completed_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

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
}
