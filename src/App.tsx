import "./App.css";
import Footer from "./components/footer";
import Navbar from "./components/navbar";

import ImageGallery from "./new-components/image-gallery";

function App() {
  return (
    <main>
      <Navbar />
      <ImageGallery />
      <Footer />
    </main>
  );
}

export default App;
