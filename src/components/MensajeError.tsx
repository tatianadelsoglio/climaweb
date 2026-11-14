interface MensajeErrorProps {
  mensaje: string;
}

export default function MensajeError({ mensaje }: MensajeErrorProps) {
  return (
    <p role="alert" className="rounded bg-red-800 p-4 text-center text-white">
      {mensaje}
    </p>
  );
}
