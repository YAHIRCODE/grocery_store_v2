<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success(): void
    {
        $this->createAdmin();

        $response = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user']);
    }

    public function test_login_wrong_password(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_missing_fields(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422);
    }

    public function test_me_returns_user(): void
    {
        $this->loginAsAdmin();

        $response = $this->getJson('/api/me', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('id', $this->adminUser->id);
    }

    public function test_me_unauthenticated(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    public function test_logout_success(): void
    {
        $this->createAdmin();

        $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response = $this->withHeader('Referer', 'http://localhost:5173')->postJson('/api/logout');

        $response->assertStatus(200);
    }

    public function test_logout_unauthenticated(): void
    {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    }
}
