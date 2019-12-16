using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Dostavochka.Models
{
    public class CreateOrderModel
    {

        [Required]
        public List<CreateOrderProductModel> Products { get; set; }

        public string Memo { get; set; }

        [Required]
        public decimal Budget { get; set; }

        [Required]
        public decimal Tip { get; set; }

        [Required]
        public string Address { get; set; }
    }
}