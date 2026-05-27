"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { SimpleTopbar } from "../primitives";

export function TripDetailTopbar() {
  const tripCode = getVagabondMockData().trip.id.toUpperCase();
  return <SimpleTopbar crumb={`Trip · ${tripCode}`} title="Trip detail" />;
}
