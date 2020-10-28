<script>
  import Icon from "../atoms/Icon.svelte";
  let src = "images/logo/ikea-logo-small.svg";

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  const toggleNav = () => dispatch("toggle", { show: true });
  const setHome = () => dispatch("sethome", {});
</script>

<style type="text/scss">
  header {
    width: 100%;
    height: 3.75rem;
    padding: 0 1.25rem;
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    align-items: center;

    img {
      width: 4.6875rem;
    }

    :global([ref="header-icon"]) {
      margin-left: 0.125rem;
    }
  }
</style>

<header>
  <img {src} alt="ikea logo" on:click={setHome} style="cursor: pointer;" />
  <Icon icon="user" ref="header-icon" />
  <Icon icon="wishList" ref="header-icon" />
  <Icon icon="shoppingBag" ref="header-icon" />
  <Icon icon="menu" ref="header-icon" on:click={toggleNav} />
</header>
