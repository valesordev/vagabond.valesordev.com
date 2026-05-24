export type LifestyleScreen =
  | "dashboard"
  | "planner"
  | "trip-detail"
  | "budget"
  | "catalog"
  | "location-detail"
  | "field-log"
  | "reconcile"
  | "monitor"
  | "settings";

export type LifestyleNavigateProps = {
  onNavigate?: (screen: LifestyleScreen) => void;
};

export type ConnectivityMode = "online" | "offline" | "starlink";
