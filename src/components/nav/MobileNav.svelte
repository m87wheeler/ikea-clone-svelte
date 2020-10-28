<script>
  import Notification from "../../svg/Notification.svelte";
  import Button from "../atoms/Button.svelte";
  import Icon from "../atoms/Icon.svelte";
  let src = "images/logo/ikea-logo-small.svg";

  import { createEventDispatcher } from "svelte";
  import SearchBar from "../molecules/SearchBar.svelte";
  import MobileNavRooms from "./MobileNavRooms.svelte";
  import MobileNavProducts from "./MobileNavProducts.svelte";

  export let active = false;
  $: page = "main";

  const dispatch = createEventDispatcher();
  const toggleNav = () => {
    page = "main";
    dispatch("toggle", { show: false });
  };
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .nav {
    position: fixed;
    top: 0;
    left: -100vw;
    width: 100vw;
    height: 100vh;
    padding: 1rem 0;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    row-gap: 1.5rem;
    background: $color-white;
    z-index: 99999;
    transition: left 0.1s linear;

    &--active {
      left: 0;
    }

    &__head {
      width: 100%;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      img {
        width: 4.6875rem;
      }
    }

    &__search {
      display: grid;
      grid-template-columns: auto 1fr auto;
      padding: 0 1rem;
    }

    &__extended,
    &__main {
      list-style-type: none;
      padding: 0 1rem;
    }

    &__extended {
      button {
        margin-top: 1.25rem;
        font-family: $font-sans;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.333;
        letter-spacing: -0.0075rem;
        border: none;
        background: transparent;
        color: $color-gray-900;

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }

    &__main {
      li {
        margin-top: 1.25rem;

        a {
          font-size: 0.875rem;
          text-decoration: none;
          color: $color-gray-900;

          &:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        }
      }
    }

    &__language {
      padding-left: 1rem;

      .icon {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 0.25rem;
        align-items: center;
        font-weight: 600;
        color: #fff;
        filter: invert(1) contrast(0.5);
      }
    }
  }
</style>

<nav class="nav" class:nav--active={active}>
  {#if page === 'main'}
    <div class="nav__head">
      <a href="/"><img {src} alt="IKEA Logo" /></a>
      <Icon icon="close" on:click={toggleNav} />
    </div>
  {:else}
    <div class="nav__search">
      <Icon
        icon="arrow"
        style="transform: rotate(180deg)"
        on:click={() => (page = 'main')} />
      <SearchBar hover noIcon style="margin: 0 .5rem;" />
      <Icon icon="close" on:click={toggleNav} />
    </div>
  {/if}
  {#if page === 'main'}
    <ul class="nav__extended">
      <li><button on:click={() => (page = 'products')}>Products</button></li>
      <li><button on:click={() => (page = 'rooms')}>Rooms</button></li>
    </ul>
    <ul class="nav__main">
      <li><a href="/">Customer Services</a></li>
      <li><a href="/">Offers</a></li>
      <li><a href="/">Inspiration</a></li>
      <li><a href="/">Green energy - switch & save</a></li>
      <li><a href="/">IKEA Food</a></li>
      <li><a href="/">IKEA for Business</a></li>
    </ul>
    <div class="nav__language">
      <Button>
        <span class="icon">
          <Notification />
          Change country
        </span>
      </Button>
    </div>
  {:else if page === 'products'}
    <MobileNavProducts />
  {:else if page === 'rooms'}
    <MobileNavRooms />
  {/if}
</nav>
