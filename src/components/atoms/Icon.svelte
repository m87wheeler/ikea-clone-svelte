<script>
  import { propTypes } from "../../assets/PropTypes";

  import ImageSearch from "../../svg/ImageSearch.svelte";
  import Menu from "../../svg/Menu.svelte";
  import Notification from "../../svg/Notification.svelte";
  import Search from "../../svg/Search.svelte";
  import ShoppingBag from "../../svg/ShoppingBag.svelte";
  import ToggleArrow from "../../svg/ToggleArrow.svelte";
  import User from "../../svg/User.svelte";
  import WishList from "../../svg/WishList.svelte";

  export let ref = undefined;
  export let cursor = "pointer";
  export let small = false;
  export let xsmall = false;
  export let icon;
  export let hover = true;
  export let style = "";
  export let background = "gray-100";

  propTypes(cursor, [
    "auto",
    "default",
    "pointer",
    "text",
    "zoom-in",
    "zoom-out",
  ]);
  propTypes(icon, [
    "imageSearch",
    "menu",
    "notification",
    "search",
    "shoppingBag",
    "toggleArrow",
    "user",
    "wishList",
  ]);
  propTypes(small, "bool");
  propTypes(xsmall, "bool");
  propTypes(hover, "bool");
  propTypes(background, ["light-gray", "gray-100", "gray-800"]);
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    overflow: hidden;
    display: inline-block;
    border-radius: 100%;
    cursor: pointer;

    &--small {
      width: 2rem;
      height: 2rem;
    }

    &--xsmall {
      width: 1.125rem;
      height: 1.125rem;
    }

    .background-color {
      position: absolute;
      top: 0;
      left: 0;
      width: inherit;
      height: inherit;
      opacity: 0;
      transition: opacity 0.1s cubic-bezier(0.4, 0, 0.4, 1);
      z-index: 0;

      &--gray-100 {
        background: $color-gray-100;
      }
      &--gray-800 {
        background: $color-gray-800;
      }
      &--light-gray {
        background: $color-light-gray;
      }
    }

    &:hover {
      .background-color {
        opacity: 1;
      }
    }

    &--no-hover {
      .background-color {
        background: transparent;
      }
    }

    .icon {
      position: relative;
      width: inherit;
      height: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1;
    }
  }
</style>

<div
  {ref}
  on:click
  class={`container ${small ? 'container--small' : xsmall ? 'container--xsmall' : null} ${!hover && 'container--no-hover'}`}
  style={`cursor: ${cursor} ${style}`}>
  <div class={`background-color background-color--${background}`} />
  <div class="icon">
    {#if icon === 'imageSearch'}
      <ImageSearch />
    {:else if icon === 'menu'}
      <Menu />
    {:else if icon === 'notification'}
      <Notification />
    {:else if icon === 'search'}
      <Search />
    {:else if icon === 'shoppingBag'}
      <ShoppingBag />
    {:else if icon === 'toggleArrow'}
      <ToggleArrow />
    {:else if icon === 'user'}
      <User />
    {:else if icon === 'wishList'}
      <WishList />
    {/if}
  </div>
</div>
