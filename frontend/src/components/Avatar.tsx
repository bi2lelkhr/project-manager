import { FaCheckCircle } from "react-icons/fa";

export const AvatarImage = ({
  name = "?", 
  isAdmin,
  height,
}: {
  name?: string;
  isAdmin: boolean;
  height?: string;
}) => {

  const safeName = name && name.trim().length > 0 ? name : "?";

  const colors = [
    "#C22021",
    "#FF5733",
    "#FFC300",
    "#DAF7A6",
    "#33FF57",
    "#3357FF",
    "#8E44AD",
    "#2ECC71",
  ];

  
  const asciiCode = safeName.charCodeAt(0);
  const colorIndex = asciiCode % colors.length;
  const backgroundColor = colors[colorIndex];

  return (
    <div className="relative inline-block" title={safeName}>
      
      <img
        className={`rounded-full ${height ?? "max-h-11"} me-1`}
        src={`https://ui-avatars.com/api/?background=${backgroundColor.slice(
          1
        )}&color=fff&name=${safeName.charAt(0)}`}
        alt={safeName}
      />

      {isAdmin && (
        <FaCheckCircle
          className="absolute bottom-0 right-0 text-blue-500"
          size={16}
          style={{ transform: "translate(25%, 25%)" }}
        />
      )}
    </div>
  );
};
