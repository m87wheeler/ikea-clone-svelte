<script>
  import Title from "../atoms/Title.svelte";
  import { rooms } from "./navData";
</script>

<style type="text/scss">
  .container {
    height: 100%;
    max-width: 100vw;
    padding: 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow-x: hidden;
    overflow-y: scroll;

    .room {
      width: 50%;
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
