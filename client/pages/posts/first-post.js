import InfiniteForm from "../../components/infiniteForm";

export default function FirstPost() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}> 
      <InfiniteForm></InfiniteForm>
      <div style={{ flexGrow: 1, backgroundColor: "#f3f3f3" }}> 
        {/* Content of the second div */}
      </div>
    </div>
  );
}
