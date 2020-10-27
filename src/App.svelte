<script>
  import HeadNotification from "./components/molecules/HeadNotification.svelte";
  import Header from "./components/molecules/Header.svelte";
  import SearchBar from "./components/molecules/SearchBar.svelte";
  import Homepage from "./components/views/Homepage.svelte";
</script>

<style type="text/scss">
</style>

<HeadNotification
  text="Our Christmas shop is now open"
  action="link"
  href="#" />
<Header />
<SearchBar placeholder="What are you looking for?" hover />
<Homepage />
