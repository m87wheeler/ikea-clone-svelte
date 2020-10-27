<script>
  import HeadNotification from "./components/molecules/HeadNotification.svelte";
  import Header from "./components/organisms/Header.svelte";
  import SearchBar from "./components/molecules/SearchBar.svelte";
  import Homepage from "./components/views/Homepage.svelte";
  import MobileNav from "./components/views/MobileNav.svelte";

  console.log(
    "%cLEFT OFF IN MOBILENAVROOMS",
    `
  background: white;
  border: 3px solid red;
  color: red;
  font-size: 20px;
  margin: 5px;
  padding: 20px;
`
  );

  let showNav = true;
  const toggleNav = (e) => {
    showNav = e.detail.show;
    console.log("click");
  };
  if (showNav) {
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
  }
</script>

<style type="text/scss">
</style>

<HeadNotification
  text="Our Christmas shop is now open"
  action="link"
  href="#" />
<Header on:toggle={toggleNav} />
<MobileNav active={showNav} on:toggle={toggleNav} />
<SearchBar placeholder="What are you looking for?" hover />
<Homepage />
