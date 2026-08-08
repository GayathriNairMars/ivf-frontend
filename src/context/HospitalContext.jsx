import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import adminApi from "../api/adminApi";

const DEFAULT_HOSPITAL = {
  hospital_name: "Hospital Management System",
  hospital_short_name: "HIMS",
  hospital_tagline: "Excellence in Reproductive Health",
  logo_url: null,
  logo_light_url: null,
  favicon_url: null,
  primary_color: "#7C3AED",
  primary_color_dark: "#5B21B6",
  secondary_color: "#EC4899",
  accent_color: "#0dcaf0",
  phone: "",
  phone_secondary: null,
  email: "",
  address: "",
  website: "",
  facebook_url: null,
  twitter_url: null,
  instagram_url: null,
  youtube_url: null,
  linkedin_url: null,
  footer_text: "© Hospital Management System. All rights reserved.",
  footer_links: [],
  business_hours: {}
};

const HospitalContext = createContext({
  hospital: DEFAULT_HOSPITAL,
  loading: true,
  error: null,
  refreshHospital: () => Promise.resolve(),
});

export const HospitalProvider = ({ children }) => {
  const [hospital, setHospital] = useState(DEFAULT_HOSPITAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHospital = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await adminApi.getPublicHospitalSettings();
      // If array response, extract first item
      if (Array.isArray(data)) {
        data = data[0];
      } else if (data && data.results && Array.isArray(data.results)) {
        data = data.results[0];
      }

      if (data && typeof data === "object") {
        setHospital((prev) => ({
          ...DEFAULT_HOSPITAL,
          ...data,
          // Ensure fallbacks for critical strings
          hospital_name: data.hospital_name || DEFAULT_HOSPITAL.hospital_name,
          hospital_short_name: data.hospital_short_name || DEFAULT_HOSPITAL.hospital_short_name,
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch public hospital settings, using defaults:", err);
      setError("Failed to load hospital settings");
      setHospital(DEFAULT_HOSPITAL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  // Inject CSS root variables whenever hospital colors update
  useEffect(() => {
    const data = hospital || DEFAULT_HOSPITAL;
    const root = document.documentElement;
    if (data.primary_color) {
      root.style.setProperty("--primary-color", data.primary_color);
      root.style.setProperty("--accent", data.primary_color);
    }
    if (data.primary_color_dark) {
      root.style.setProperty("--primary-color-dark", data.primary_color_dark);
      root.style.setProperty("--accent-hover", data.primary_color_dark);
    }
    if (data.secondary_color) {
      root.style.setProperty("--secondary-color", data.secondary_color);
    }
    if (data.accent_color) {
      root.style.setProperty("--accent-color", data.accent_color);
    }
  }, [hospital]);

  // Dynamically update page title & browser favicon
  useEffect(() => {
    if (hospital?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = hospital.favicon_url;
    }
  }, [hospital]);

  return (
    <HospitalContext.Provider value={{ hospital, loading, error, refreshHospital: fetchHospital }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
export default HospitalContext;
