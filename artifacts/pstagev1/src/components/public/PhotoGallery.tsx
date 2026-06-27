import { Provider } from "@/lib/types";

interface PhotoGalleryProps {
  photos: Provider['photos'];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="photo-gallery">
      <div className="photo-gallery-main">
        <img
          src={photos[0]}
          alt="Principal"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 500ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
          }}
        />
      </div>
      {photos.slice(1, 5).map((photo, index) => (
        <div key={index} style={{ overflow: "hidden" }}>
          <img
            src={photo}
            alt={`Galerie ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 500ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
            }}
          />
        </div>
      ))}
    </div>
  );
}
