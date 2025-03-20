import { Suspense } from "react";
import QRCodePage from "./QRCodePage";

const Page: React.FC = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <QRCodePage />
      </Suspense>
    </div>
  );
};

export default Page;
