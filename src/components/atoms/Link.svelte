<script>
  import ToggleArrow from "../../svg/ToggleArrow.svelte";

  export let href = "/";
  export let icon = false;
  export let style = "";
  export let inline = false;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .link {
    display: inline-grid;
    grid-template-columns: 1fr auto;
    grid-gap: 0.5rem;
    text-decoration: none;
    color: $color-gray-900;

    &:hover {
      text-decoration: underline;
    }

    .text {
      font-size: 0.875rem;
      line-height: 1.57143;
      font-weight: 700;
    }

    .icon {
      display: flex;
      justify-content: center;
      transform: rotate(-90deg);
      filter: invert(1);
    }
  }

  .inline-link {
    @include common-text;
    display: inline-block;
  }
</style>

<a {href} class={`${inline ? 'inline-link' : 'link'}`} {style}>
  <div class="text">
    <slot />
  </div>
  {#if icon}
    <div class="icon">
      <ToggleArrow />
    </div>
  {/if}
</a>
