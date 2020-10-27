<script>
  import Icon from "../atoms/Icon.svelte";

  export let placeholder = "Search";
  export let hover = false;
  export let noIcon = false;
  export let style;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .search-bar {
    width: calc(100% - 2.5rem);
    margin: 0 1.25rem;
    padding: 0.2rem 0.5rem;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    border-radius: 2.75rem;

    form {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;

      input {
        width: inherit;
        height: inherit;
        padding: inherit;
        border: none;
        background: inherit;
        font-size: 1rem;

        &:focus {
          outline: none;
        }
      }
    }

    &__primary {
      width: calc(inherit - 4px);
      height: calc(inherit - 4px);
      border: 2px solid $color-ikea-blue;
    }

    &__secondary {
      width: inherit;
      height: inherit;
      background: $color-gray-100;
      transition: background 0.2s cubic-bezier(0.4, 0, 0.4, 1);

      &:hover {
        background: $color-light-gray;
      }
    }
  }
</style>

<div
  class={`search-bar ${hover ? 'search-bar__secondary' : 'search-bar__primary'}`}
  {style}>
  <form>
    <Icon icon="search" cursor="text" hover={false} />
    <input type="text" {placeholder} />
  </form>
  {#if !noIcon}
    <Icon icon="imageSearch" small background="light-gray" />
  {/if}
</div>
