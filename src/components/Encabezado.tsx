interface EncabezadoProps {
  titulo: string;
}

export default function Encabezado({ titulo }: EncabezadoProps) {
  return (
    <header className="bg-sky-700 py-4 text-center">
      <h1 className="px-4 text-2xl font-semibold text-white">{titulo}</h1>
    </header>
  );
}
