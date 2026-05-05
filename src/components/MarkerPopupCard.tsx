/**
 * Shared card layout for campus point-of-interest popups.
 *
 * Academic, housing, and recreation markers share this component so their
 * popups have consistent headings, tags, highlights, and external links.
 */

type MarkerPopupCardProps = {
    theme: 'academic' | 'housing' | 'recreation';
    label: string;
    title: string;
    description: string;
    chips?: string[];
    highlights?: string[];
    link?: string;
    linkLabel?: string;
};

/** Render a themed informational popup card for a static campus location. */
export function MarkerPopupCard({
    theme,
    label,
    title,
    description,
    chips = [],
    highlights = [],
    link,
    linkLabel = 'Official page',
}: MarkerPopupCardProps) {
    const visibleHighlights = highlights.slice(0, 2);

    return (
        <div className={`marker-popup-card marker-popup-card--${theme}`}>
            <div className="marker-popup-card__topline">
                <span className="marker-popup-card__label">{label}</span>
                {chips.length > 0 && (
                    <div className="marker-popup-card__chips">
                        {chips.map((chip) => (
                            <span key={chip} className="marker-popup-card__chip">
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <h3 className="marker-popup-card__title">{title}</h3>
            <p className="marker-popup-card__description">{description}</p>

            {visibleHighlights.length > 0 && (
                <ul className="marker-popup-card__list">
                    {visibleHighlights.map((highlight) => (
                        <li key={highlight} className="marker-popup-card__list-item">
                            {highlight}
                        </li>
                    ))}
                </ul>
            )}

            {link && (
                <a
                    className="marker-popup-card__link"
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                >
                    {linkLabel}
                </a>
            )}
        </div>
    );
}
