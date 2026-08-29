<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'user_id',
        'name',
        'email',
        'phone',
        'avatar',
        'joining_date',
        'department_id',
        'sub_department_id',
        'designation_id',
        'employment_type',
        'base_salary_pkr',
        'allowed_paid_leaves',
        'bank_name',
        'account_number',
        'iban',
        'emergency_contact',
        'notes',
        'status',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'base_salary_pkr' => 'decimal:2',
        'allowed_paid_leaves' => 'float',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Employee $employee) {
            $employee->deleteOldAvatarFile();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function subDepartment(): BelongsTo
    {
        return $this->belongsTo(SubDepartment::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(MonthlyPayroll::class);
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'assigned_employee_id');
    }

    public function serviceTasks(): HasMany
    {
        return $this->hasMany(ServiceTask::class, 'assigned_employee_id');
    }

    /**
     * Mutator for avatar attribute.
     */
    public function setAvatarAttribute($value): void
    {
        if (is_null($value) || $value === '') {
            $this->deleteOldAvatarFile();
            $this->attributes['avatar'] = null;
            return;
        }

        if ($value instanceof UploadedFile && $value->isValid()) {
            $this->deleteOldAvatarFile();

            $destinationPath = public_path('uploads/employees');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $filename = time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['avatar'] = '/uploads/employees/' . $filename;
            return;
        }

        if (is_string($value)) {
            if (str_contains($value, 'Temp') || str_contains($value, '.tmp')) {
                return;
            }
            $this->attributes['avatar'] = $value;
        }
    }

    public function deleteOldAvatarFile(): void
    {
        $oldPath = $this->getRawOriginal('avatar');
        if ($oldPath && !str_contains($oldPath, '.tmp') && file_exists(public_path($oldPath))) {
            @unlink(public_path($oldPath));
        }
    }
}
