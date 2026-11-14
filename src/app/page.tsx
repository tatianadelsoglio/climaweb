import BuscadorClima from "@/components/BuscadorClima";
import Encabezado from "@/components/Encabezado";

export default function Home() {
  return (
    <>
      <Encabezado titulo="Clima" />
      <main className="flex-1">
        <BuscadorClima />
      </main>
    </>
  );
}
