<?php

namespace App\Mail;

use App\Models\SupplierNote;
use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupplierNoteConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SupplierNote $note,
        public array $diferencias,
        public ?string $observaciones,
        public Employee $employee,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nota confirmada - {$this->note->supplier->company_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.supplier-note-confirmed',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
