import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  MoonStar,
  Snowflake,
  Sun,
} from "lucide-react";

interface IconoCondicionProps {
  codigo: number;
  /** Elige la variante nocturna de los íconos que la tienen. */
  noche: boolean;
  className?: string;
}

const ICONOS = {
  tormenta: CloudLightning,
  llovizna: CloudDrizzle,
  lluvia: CloudRain,
  nieve: Snowflake,
  niebla: CloudFog,
  "pocas-nubes-dia": CloudSun,
  "pocas-nubes-noche": CloudMoon,
  nublado: Cloud,
  "despejado-dia": Sun,
  "despejado-noche": MoonStar,
} as const;

function clavePara(codigo: number, noche: boolean): keyof typeof ICONOS {
  const grupo = Math.floor(codigo / 100);
  if (grupo === 2) return "tormenta";
  if (grupo === 3) return "llovizna";
  if (grupo === 5) return "lluvia";
  if (grupo === 6) return "nieve";
  if (grupo === 7) return "niebla";

  if (codigo === 801 || codigo === 802) return noche ? "pocas-nubes-noche" : "pocas-nubes-dia";
  if (codigo === 803 || codigo === 804) return "nublado";
  return noche ? "despejado-noche" : "despejado-dia";
}

/** Ícono decorativo: la condición ya se informa en texto. */
export default function IconoCondicion({ codigo, noche, className }: IconoCondicionProps) {
  const Icono = ICONOS[clavePara(codigo, noche)];
  return <Icono aria-hidden className={className} />;
}
