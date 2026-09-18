<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'wa_id',
        'wa_name',
        'phone',
        'address',
        'total_orders',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'total_orders' => 'integer',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function notifications()
    {
        return $this->hasMany(\App\Models\Notification::class);
    }
}
