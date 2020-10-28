<script>
  import Title from "../atoms/Title.svelte";
  import { rooms } from "./navData";
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    height: 100%;
    max-width: 100vw;
    width: 100%;
    padding: 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 1rem;
    overflow-x: hidden;
    overflow-y: scroll;

    .room {
      width: 100%;

      img {
        width: 100%;
      }

      p {
        margin: 0.625rem 0 1.5rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: $color-gray-900;
      }
    }
  }
</style>

<Title type="h2" style="padding-left: 1rem;">Rooms</Title>
<div class="container">
  {#each rooms as room}
    <div class="room">
      <img src={room.src} alt={room.room} />
      <p>{room.room}</p>
    </div>
  {/each}
</div>
