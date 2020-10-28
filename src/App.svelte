<script>
  import HeadNotification from "./components/molecules/HeadNotification.svelte";
  import Header from "./components/organisms/Header.svelte";
  import SearchBar from "./components/molecules/SearchBar.svelte";
  import Homepage from "./components/views/Homepage.svelte";
  import MobileNav from "./components/nav/MobileNav.svelte";
  import ProductPage from "./components/views/ProductPage.svelte";
  import Footer from "./components/organisms/Footer.svelte";

  let showNav = false;
  const toggleNav = (e) => (showNav = e.detail.show);
  if (showNav) {
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
  }

  // update currentProduct to display ProductPage
  let currentPage = "home";
  let currentProduct = 90476908;

  const productView = (e) => {
    currentPage = "product";
    currentProduct = e.detail.artno;
  };
</script>

<style type="text/scss">
</style>

<HeadNotification
  text="Our Christmas shop is now open"
  action="link"
  href="#" />
<Header on:toggle={toggleNav} on:sethome={() => (currentPage = 'home')} />
<MobileNav active={showNav} on:toggle={toggleNav} />
<SearchBar placeholder="What are you looking for?" hover />
{#if currentPage === 'home'}
  <Homepage on:productview={productView} />
{:else if currentPage === 'product'}
  <ProductPage artNumber={currentProduct} />
{/if}
<Footer />
