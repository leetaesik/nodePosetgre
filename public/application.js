
const vm = new Vue({
  el: '#app',
  data: {
    results: []
  },
  mounted() {
    axios.get("http://localhost:3000/api/puppies")
    .then(response => {this.results = response.data.results})
  }
});


function searchClick(){
  alert("test");
  //this.fetchItems();
}

/*const url = "http://localhost:3000/api/puppies";

const vm = new Vue({
        el: '#app',
        data: {
          results: []
        },
        mounted() {
          axios.get(url).then(response => {
            this.results = response.data
          })
        }
      });
*/
