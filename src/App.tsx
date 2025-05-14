import "./App.css";
import Footer from "./components/footer";
import Grid from "./components/grid";
import Navbar from "./components/navbar";

function App() {
  return (
    <main>
      {/* section 01 */}
      <Navbar />
      <Grid />
      {/* <AnimatedGrid /> */}
      <Footer />
    </main>
  );
}

export default App;
