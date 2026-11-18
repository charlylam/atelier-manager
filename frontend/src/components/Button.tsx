import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'sm';

type ClassOptions = {
  variant: Variant;
  size: Size;
  className?: string;
};

// Les chaînes restent des littéraux complets : Tailwind ne génère que les classes qu'il lit
// telles quelles dans le code source.
const BASE = 'rounded-md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-emerald-800 text-white',
  secondary: 'border border-neutral-300 dark:border-neutral-700',
};

const SIZES: Record<Size, string> = {
  md: 'px-4 py-2',
  sm: 'px-3 py-1 text-sm',
};

/**
 * Classes d'un bouton : le noyau commun (arrondi, couleurs de la variante, taille).
 * Ce qui est propre à un usage (graisse, état désactivé, marge) passe par `className`.
 * Sert aussi aux liens (`<Link>`, `<a>`) stylés en bouton.
 */
export function buttonClasses({ variant, size, className }: ClassOptions) {
  return [BASE, VARIANTS[variant], SIZES[size], className]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  // Obligatoire et sans valeur par défaut : le type HTML par défaut est « submit ».
  type: 'button' | 'submit' | 'reset';
  variant: Variant;
  size: Size;
};

export function Button({
  variant,
  size,
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
