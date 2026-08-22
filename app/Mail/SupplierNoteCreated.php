<?php

namespace App\Mail;

use App\Models\SupplierNote;
use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupplierNoteCreated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SupplierNote $note,
        public Employee $employee,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nueva nota de trato - {$this->note->supplier->company_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.supplier-note-created',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
