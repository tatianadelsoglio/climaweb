import type { ClimaActual } from "@/types/clima";

interface ClimaProps {
  clima: ClimaActual;
}

function formatearGrados(valor: number): string {
  return `${valor.toFixed(1)} °C`;
}

export default function Clima({ clima }: ClimaProps) {
  return (
    <section className="rounded bg-white p-6 text-center shadow">
      <h2 className="text-xl">
        El clima de {clima.ciudad} ({clima.pais}) es:
      </h2>
      <p className="my-4 text-5xl font-semibold sm:text-6xl">
        {formatearGrados(clima.temperatura)}
      </p>
      <p className="text-lg">
        Temperatura máxima: {formatearGrados(clima.temperaturaMaxima)}
      </p>
      <p className="text-lg">
        Temperatura mínima: {formatearGrados(clima.temperaturaMinima)}
      </p>
    </section>
  );
}
