import React, { useState } from "react";
import { useHospital } from "../context/HospitalContext";
import { Building2, Activity } from "lucide-react";

/**
 * Reusable Hospital Logo Component
 * Supports variants: 'default' | 'light' | 'icon'
 * Falls back to stylized medical/building icon if image fails to load or is null.
 */
export const HospitalLogo = ({
  variant = "default",
  className = "",
  style = {},
  alt = "",
  size = 36,
}) => {
  const { hospital } = useHospital();
  const [imgError, setImgError] = useState(false);

  const getLogoSrc = () => {
    if (variant === "light") {
      return hospital.logo_light_url || hospital.logo_url;
    }
    return hospital.logo_url;
  };

  const src = getLogoSrc();

  if (!src || imgError || variant === "icon") {
    return (
      <div
        className={`hospital-logo-fallback ${variant} ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "10px",
          background: variant === "light" ? "rgba(255, 255, 255, 0.15)" : "var(--primary-color, #7C3AED)",
          color: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "700",
          fontSize: Math.max(11, Math.floor(size * 0.35)),
          flexShrink: 0,
          ...style,
        }}
        title={hospital.hospital_name}
      >
        <Building2 size={Math.floor(size * 0.55)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || hospital.hospital_name || "Hospital Logo"}
      className={`hospital-logo-img ${variant} ${className}`}
      style={{
        maxHeight: size,
        maxWidth: "100%",
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
      onError={() => setImgError(true)}
    />
  );
};

/**
 * Reusable Hospital Brand Component
 * Renders Hospital Logo, Name/Short Name, and Portal label.
 */
export const HospitalBrand = ({
  portal = "",
  variant = "default",
  className = "",
  showTagline = false,
  onClick = null,
  logoSize = 36,
  style = {},
}) => {
  const { hospital } = useHospital();

  return (
    <div
      className={`hospital-brand-container ${variant} ${className}`}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <HospitalLogo variant={variant} size={logoSize} />
      <div
        className="hospital-brand-text"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          lineHeight: "1.2",
        }}
      >
        <span
          className="hospital-name"
          style={{
            fontWeight: "700",
            fontSize: "1.1rem",
            color: variant === "light" ? "#ffffff" : "var(--text, #101828)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {hospital.hospital_short_name || hospital.hospital_name || "HIMS"}
        </span>
        {portal && (
          <span
            className="hospital-portal-name"
            style={{
              fontSize: "0.75rem",
              fontWeight: "500",
              color: variant === "light" ? "rgba(255, 255, 255, 0.7)" : "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {portal}
          </span>
        )}
        {showTagline && hospital.hospital_tagline && !portal && (
          <span
            className="hospital-tagline"
            style={{
              fontSize: "0.72rem",
              color: variant === "light" ? "rgba(255, 255, 255, 0.6)" : "#94a3b8",
            }}
          >
            {hospital.hospital_tagline}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Reusable Hospital Footer Component
 */
export const HospitalFooter = ({ className = "", style = {} }) => {
  const { hospital } = useHospital();

  const currentYear = new Date().getFullYear();
  const defaultText = `© ${currentYear} ${hospital.hospital_name || "Hospital Management System"}. All rights reserved.`;

  return (
    <footer
      className={`hospital-brand-footer ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        fontSize: "0.85rem",
        color: "#64748b",
        borderTop: "1px solid #e2e8f0",
        flexWrap: "wrap",
        gap: "12px",
        ...style,
      }}
    >
      <span>{hospital.footer_text || defaultText}</span>
      {Array.isArray(hospital.footer_links) && hospital.footer_links.length > 0 && (
        <div className="hospital-footer-links" style={{ display: "flex", gap: "16px" }}>
          {hospital.footer_links.map((link, i) => (
            <a
              key={i}
              href={link.url || "#"}
              style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={(e) => (e.target.style.color = "var(--primary-color, #7C3AED)")}
              onMouseOut={(e) => (e.target.style.color = "#64748b")}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
};

export default HospitalBrand;
