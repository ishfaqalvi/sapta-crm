<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'type',
        'client_id',
    ];

    /**
     * Check if user is an admin type user.
     */
    public function isAdmin(): bool
    {
        return $this->type === 'admin';
    }

    /**
     * Check if user is a client type user.
     */
    public function isClient(): bool
    {
        return $this->type === 'client';
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Eloquent Boot Event: Auto-delete avatar file from disk when user model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            $user->deleteOldAvatarFile();
        });
    }

    /**
     * Classic Mutator for the avatar attribute.
     * Guarantees UploadedFile instances are saved to public/uploads/avatars
     * and raw attribute is set to '/uploads/avatars/filename.ext'.
     */
    public function setAvatarAttribute($value): void
    {
        // If null or empty string passed, remove existing avatar
        if (is_null($value) || $value === '') {
            $this->deleteOldAvatarFile();
            $this->attributes['avatar'] = null;
            return;
        }

        // If an UploadedFile instance is passed, upload & replace file
        if ($value instanceof UploadedFile && $value->isValid()) {
            $this->deleteOldAvatarFile();

            $destinationPath = public_path('uploads/avatars');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $filename = time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['avatar'] = '/uploads/avatars/' . $filename;
            return;
        }

        // If a valid string path is passed
        if (is_string($value)) {
            // Ignore temp file paths if passed as string
            if (str_contains($value, 'Temp') || str_contains($value, '.tmp')) {
                return;
            }
            $this->attributes['avatar'] = $value;
        }
    }

    /**
     * Helper to delete physical avatar file from public storage.
     */
    public function deleteOldAvatarFile(): void
    {
        $oldPath = $this->getRawOriginal('avatar');
        if ($oldPath && !str_contains($oldPath, '.tmp') && file_exists(public_path($oldPath))) {
            @unlink(public_path($oldPath));
        }
    }
}
