export default class AboutPage {
  async render() {
    return `
      <section class="container about-section" aria-labelledby="about-heading">
        <h1 id="about-heading">Tentang Story App</h1>
        <p>Story App adalah platform berbagi cerita dan pengalaman melalui foto beserta lokasi geografis.</p>
        <p>Dibuat sebagai proyek IDCamp Expert Level — memanfaatkan Story API dari Dicoding.</p>
        <h2>Fitur Utama</h2>
        <ul>
          <li>Berbagi cerita dengan foto dan deskripsi</li>
          <li>Visualisasi lokasi cerita pada peta interaktif</li>
          <li>Multiple tile layer: OpenStreetMap, Topografi, Satelit</li>
          <li>Pengambilan foto langsung dari kamera</li>
        </ul>
      </section>
    `;
  }

  async afterRender() {}
}
