
import { IconProvider as Icon_ } from '@/lib/icons';
import { IconProps } from '@/types';
import React from 'react';

export default function Icon({ name, size = 25, color }: IconProps) {

  return (
    <Icon_
      name={name}
      size={size}
      color={color}
    />
  );
}
