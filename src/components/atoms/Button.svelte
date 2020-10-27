<script>
  export let secondary = false;
  export let tertiary = false;
  export let small = false;
  export let href = "";
  export let style = "";
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .button {
    display: inline-block;
    width: auto;
    height: auto;
    padding: 0.75rem 1.5rem;
    border: 1px solid $color-gray-200;
    border-radius: 2.5rem;
    font-family: $font-sans;
    font-size: 0.75rem;
    line-height: 1.333;
    font-weight: 700;
    text-decoration: none;
    text-align: center;
    background: transparent;
    color: $color-gray-900;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      border: 1px solid $color-gray-700;
    }

    &--small {
      width: auto;
      padding: 0.75rem 1.5rem 0.75rem 1.5rem;
      border-radius: 1.75rem;
      font-size: 0.7rem;
      white-space: nowrap;
    }

    &--secondary {
      background: $color-gray-900;
      border: 1px solid $color-gray-900;
      color: $color-white;

      &:hover {
        background: $color-gray-800;
        border: 1px solid $color-gray-800;
      }
    }

    &--tertiary {
      background: $color-gray-100;
      border: 1px solid $color-gray-100;

      &:hover {
        background: $color-gray-200;
        border: 1px solid $color-gray-200;
      }
    }
  }
</style>

{#if href.length}
  <a
    class="button"
    class:button--secondary={secondary}
    class:button--tertiary={tertiary}
    class:button--small={small}
    {href}
    {style}><slot /></a>
{:else}
  <button
    class="button"
    class:button--secondary={secondary}
    class:button--tertiary={tertiary}
    class:button--small={small}
    {style}
    on:click><slot /></button>
{/if}
