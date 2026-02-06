<script>
    export let image;
  </script>
  
  <div class="full-image">
    <div class="image">
      <img src={image} alt="" />
    </div>
  </div>

<style>
  .full-image {
    overflow: hidden;
  }
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
</style>
  