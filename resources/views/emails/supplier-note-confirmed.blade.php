@component('mail::message')

# Nota de trato confirmada

La nota de trato con **{{ $note->supplier->company_name }}** ha sido confirmada por {{ $employee->first_name }} {{ $employee->last_name }}.

**Monto total:** ${{ number_format($note->total_amount, 2) }}

## Diferencias

| Producto | Pactado | Recibido | Diferencia |
|----------|---------|----------|------------|
@foreach($diferencias as $diff)
| {{ $diff['producto'] }} | {{ $diff['pactado'] }} | {{ $diff['recibido'] }} | {{ $diff['diferencia'] }} |
@endforeach

@if($observaciones)
**Observaciones:** {{ $observaciones }}
@endif

@component('mail::button', ['url' => ''])
Ver nota
@endcomponent

Saludos,<br>
{{ config('app.name') }}
@endcomponent
