import React from 'react';

interface IconProps {
    size?: number | string;
    className?: string;
}

const CDN_BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';

const FluentIcon: React.FC<IconProps & { path: string; alt: string }> = ({ 
    size = 24, 
    className = "", 
    path,
    alt 
}) => (
    <img 
        src={`${CDN_BASE}/${path}`}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        className={`inline-block object-contain select-none pointer-events-none ${className}`}
        style={{ width: size, height: size }}
    />
);

// Маппинг путей Fluent UI: Название_папки/3D/название_файла_3d.png
// Используем %20 вместо пробелов для надежности URL

export const BananaIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Banana/3D/banana_3d.png" alt="Banana" />
);

export const PaletteIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Artist%20palette/3D/artist_palette_3d.png" alt="Palette" />
);

export const ModelIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="High%20voltage/3D/high_voltage_3d.png" alt="Power" />
);

export const PackIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Package/3D/package_3d.png" alt="Pack" />
);

export const BrainIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Brain/3D/brain_3d.png" alt="AI Brain" />
);

export const VectorIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Triangular%20ruler/3D/triangular_ruler_3d.png" alt="Vector" />
);

export const UpscaleIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Rocket/3D/rocket_3d.png" alt="Upscale" />
);

export const WizardIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Mage/Default/3D/mage_3d.png" alt="Wizard" />
);

export const MechanicIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Man%20mechanic/Default/3D/man_mechanic_3d.png" alt="Mechanic" />
);

export const FlashIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Lightning/3D/lightning_3d.png" alt="Flash" />
);

export const ScannerIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Eye/3D/eye_3d.png" alt="Scanner" />
);

export const HistoryIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Mantelpiece%20clock/3D/mantelpiece_clock_3d.png" alt="History" />
);

export const ForgeIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Hammer/3D/hammer_3d.png" alt="Forge" />
);

export const EmailIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Envelope/3D/envelope_3d.png" alt="Email" />
);

export const TelegramIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Paper%20airplane/3D/paper_airplane_3d.png" alt="Telegram" />
);

export const WhatsAppIcon: React.FC<IconProps> = (props) => (
    <img 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
        alt="WhatsApp"
        width={props.size || 24} 
        height={props.size || 24} 
        className={props.className}
    />
);

export const LogoutIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Door/3D/door_3d.png" alt="Logout" />
);

export const GuideIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Books/3D/books_3d.png" alt="Guide" />
);

export const WhatsNewIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Star/3D/star_3d.png" alt="New" />
);

export const MagicIcon: React.FC<IconProps> = (props) => (
    <FluentIcon {...props} path="Magic%20wand/3D/magic_wand_3d.png" alt="Magic" />
);