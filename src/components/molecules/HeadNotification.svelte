<script>
  import Icon from "../atoms/Icon.svelte";

  export let text = "Notification";
  export let action = "link";
  export let href = "Homepage";
  export let show = false;
  export let expand = false;

  const toggleexpand = () => {
    expand = !expand;
    console.log(expand);
  };

  setTimeout(() => {
    show = true;
  }, 3000);
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .notification {
    width: 100%;
    max-height: 0;
    padding: 0 1.25rem;
    overflow: hidden;
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    background: $color-gray-900;
    color: $color-white;
    font-size: 0.75rem;
    transition: max-height 0.2s linear, padding 0.2s linear;

    &--active {
      max-height: 1000px;
      padding: 0.6rem 1.25rem;
    }

    .message-section {
      width: 100%;
      min-height: 1.25rem;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;

      a {
        color: $color-white;
        text-decoration: none;
        display: flex;
        flex-flow: row nowrap;
        align-items: center;

        span {
          margin-left: 0.625rem;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .icon {
      height: 2rem;
      width: 2rem;
      transform-origin: center;
      transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);

      &--active {
        transform: rotate(180deg);
      }
    }

    .dismiss {
      max-height: 0;
      width: 100%;
      padding-top: 0;
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
        padding-top 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

      p {
        font-weight: 700;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      &--expand {
        max-height: 5rem;
        padding-top: 0.75rem;
      }
    }
  }
</style>

<div class={`notification ${show && 'notification--active'}`}>
  <div class="message-section">
    {#if action === 'link'}
      <a {href}>
        <Icon icon="notification" hover={false} xsmall />
        <span>{text}</span>
      </a>
    {:else}
      <p>{text}</p>
    {/if}
    <div class={`icon ${expand && 'icon--active'}`}>
      <Icon
        icon="toggleArrow"
        small
        background="gray-800"
        on:click={toggleexpand} />
    </div>
  </div>
  <div class={`dismiss ${expand && 'dismiss--expand'}`}>
    <p on:click={() => (show = false)}>Dismiss message</p>
  </div>
</div>
