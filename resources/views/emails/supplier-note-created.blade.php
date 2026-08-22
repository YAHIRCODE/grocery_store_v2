@component('mail::message')

# Nueva nota de trato registrada

Se ha creado una nueva nota de trato con el proveedor **{{ $note->supplier->company_name }}**.

**Creado por:** {{ $note->employee->first_name ?? 'N/A' }} {{ $note->employee->last_name ?? '' }}
**Monto total:** ${{ number_format($note->total_amount, 2) }}
**Fecha de entrega:** {{ $note->delivery_date ? $note->delivery_date->format('d/m/Y') : 'No definida' }}

@if($note->reminders)
**Recordatorios:** {{ $note->reminders }}
@endif

## Productos

| Producto | Cantidad | Precio unitario |
|----------|----------|-----------------|
@foreach($note->details as $detail)
| {{ $detail->product->name ?? 'N/A' }} | {{ $detail->quantity_agreed }} | ${{ number_format($detail->price_agreed, 2) }} |
@endforeach

@component('mail::button', ['url' => ''])
Ver nota
@endcomponent

Saludos,<br>
{{ config('app.name') }}
@endcomponent
