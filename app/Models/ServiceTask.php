<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_service_id',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(ClientService::class, 'client_service_id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }
}
