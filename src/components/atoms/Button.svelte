<script>
  export let secondary = false;
  export let tertiary = false;
  export let href;
  export let style;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .button {
    display: inline-block;
    min-width: 8.125rem;
    height: auto;
    padding: 0.75rem 1.5rem;
    border: 1px solid $color-gray-200;
    border-radius: 1.5rem;
    font-family: $font-sans;
    font-size: 0.75rem;
    line-height: 1.333;
    font-weight: 700;
    text-decoration: none;
    text-align: center;
    letter-spacing: 0;
    background: transparent;
    color: $color-gray-900;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      border: 1px solid $color-gray-700;
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

{#if href}
  <a
    class="button"
    class:button--secondary={secondary}
    class:button--tertiary={tertiary}
    {href}
    {style}><slot /></a>
{:else}
  <button
    class="button"
    class:button--secondary={secondary}
    class:button--tertiary={tertiary}
    {style}><slot /></button>
{/if}
