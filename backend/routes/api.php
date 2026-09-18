<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\BotSettingController;

Route::middleware('bot.auth')->group(function () {
    Route::get('customers/{waId}/orders', [OrderController::class, 'myOrders']);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('payments', \App\Http\Controllers\Api\PaymentController::class);
    Route::post('webhook', [WebhookController::class, 'handle']);
    Route::get('bot-settings', [BotSettingController::class, 'index']);
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});
