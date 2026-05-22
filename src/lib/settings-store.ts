import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "./settings.functions";

export type PublicSettings = {
  store_name: string;
  store_tagline: string;
  whatsapp_orders: string;
  whatsapp_support: string;
  contact_location: string;
  contact_phone: string;
  contact_email: string;
  about_text: string;
  product_layout: "grid" | "list" | "large";
};

export function useSettings(): PublicSettings | undefined {
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
    staleTime: 5 * 60 * 1000,
  });
  return data as PublicSettings | undefined;
}
