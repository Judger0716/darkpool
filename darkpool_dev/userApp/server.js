'use strict';

//global variable
var transfer_list = [];
var block_list = [];
var blockHeader_list = []; // 生成的区块头数据 20220719
var nodes = []; // 搬运工列表 20220719
var orders = []; // 生成订单数据 20220719
var dealedOrders = []; // 生成匹配结果数据 20220719
var fee = {
    'Bitcoin': {
        f: 0,
        blockNumber: 0,
    },
    'Ethereum': {
        f: 0,
        blockNumber: 0,
    },
    'Litecoin': {
        f: 0,
        blockNumber: 0,
    },
    'Dogecoin': {
        f: 0,
        blockNumber: 0,
    },
    'Cosmos': {
        f: 0,
        blockNumber: 0,
    },
    'Decred': {
        f: 0,
        blockNumber: 0,
    },
}; // 每种代币的fee总和,blockNumeb综合

//{ price: '25000', plainshares: [ [Array], [Array], [Array] ] }
var prices = [];

// 查找relayer地址
var node_name = [
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALuIz1jl5eQFMczxMq71yYMdwOTri5XbH9DFZnF+ZgL5AXTESW+86Qh0+3BMhXl6aSrjJs0ak5igs6hnyng4Y5sCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAOO9PCT0TqflnDV97X0ozza8UaF5itmZMr5iJFbmte+/9YtbfuflIb4hZvKJNX8HGbr+mak6rEbcIvREQYFDdtkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIcKfVIaYMQ6PqPOKr+UJHoSxBzcs4ulCZtocr9NavfWU2I50wtkz2WX+TIRCLSNM3axuE20nvT3K4lAhGTC598CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALNdr+3awL0nqNkaKXXr1lnKGItiTiO9fCBJrSOvqRYvnbLjK4odH1cJeXZvN3THKCadPO85IJPmQM3bj52csfkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMo6uWwnu+5bqytRjmM1Mmslzx4TXuFFyKPpxrT3XbHCUXz4JCI40CNRXjqkhv5EcC8+TDV387BQpcEbo7Leht8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALkb0CRQFrj74Tx9tTIwuI3wq0jKCk7LJ91x4eu0aScldUh3RGo5KU/jdObRnek4XHDaycgAPj+rfPWwHrSFOHkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALE6280d1cRNgGyGBw/zy8fq+jNE3qHOGsSN0Vf9XdUh+jrTeF+ujCxeB+CrahiB5fZv/GcBwHPZ20zqm2n3BPcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJwB03CjLAeRKk8Q7whQ1+tvubTFC/TO4hec017u9lLHG4nAsD8ZZVXKm48vc7eHWjypFlPYPZ7TOBkjXUJDbPECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIBH6HFWPfW2Oh1px7ubzPZL1b7E/9UpNGS37WMzX3SfPbDRj4mOxpDb1iCJC12oxIQNpZ5mr70hKVB5BZkCFNUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM9IbB9BLy5B4OP6ONs69c4q0SlzZNUzbLdBSKUruHEiCHBzM/YVFQkcRz9AbrYx2AE+EjZ9Qd4luXvAYcnF2MkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcwEDTaMj3MGlB3CXTZbvUHwXjA41HSKrRv30JGu7b1r5T7Dm+WIucynASaVEkdhnOHcFaWLyPPEyNln49IgpMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJM3A+nkL6A/fV2ms8+GP9V23CRe8hQD1Cn6/dipMguGmQGdu36vZmd/IEpXjzEBVm33h4AJzLBgsr1yLJGt9B0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJruG5rLLpeG9uxlPtveWZpxS2RxuJHa/ePiDSpof7spKkvin/RcA9y24mVJeTXBbxezo0yv1aF5BsZRO5tO/kMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJL/bg8gXDPd/cF63f7+oHg6v8LY+9Xg7OLjfRPQYnwCtwG4nPXwEUTEdWpA56nv2O0siAPlWZzDT0BvZ+FfHycCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAPqZYCCNSC57MMO6Oy1HZAo7CMyy1Pjdq0FeK8c1JYpXHoD5wkOJBbDrKa9KIGVkkXGzQSp8lc2FpKDATe/HbcECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJaFx0bAj/hiuta02ypQgW+w/SM5Z+9RTOy4pmOm0k0cX2hqhvtagQ7UcyqqOSIaQvBT73eUvRKOfEPs8BU6ihMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMFjyBwm6ClvsZsSkeX9Zw2rz3aUs/rY+BS2Ebu7O0zCzaupNhYFydMdNDyooA4VudeG5roW/fgNd3HbN43MGh0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIyTK85203z3T4IGFlqrW5VncS0YXRXR0g28fl55VGzxDR/to7VuSBAh2dj0vYlcMAd6JVcA5RjGTMYDMqtdXjECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAI5GTo4iZsN0BHe/seuo1jI1TSA/jt71feboJuKOQq/u10m4WvSN9ns9biLKoS2S440Q1cMKvZLUuU98NBvJqIMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKRvrRF2BzKYZWeQlxt96xlPCj+b2ix0zCDPbOxa/JwKwEwQ+CbIBCQGRSVkv6P9g5vmzFIKmJj99sqGXJ6ZPq8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJRyKUsyZGUYWIcIqwyQrml89oQHMvGVZYNtEK8g7UnQalMx5RQZQVd/QgMhp1J3A/QDibl0J3Qky0/2eSdfwE0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALMjPZfWb4WnyMNL6eqWCLTESddqXbyf/CIcdWzgDClLSy1EbrmXAt5KKhwu0K6hKPfTjyiehNeuNL8SdEaAkpUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALJjCkWAraw1uGskQoQl7bwXsdbNv3uWIpzK0Q0R0nmGOnuJVBfyvC7/2CWiVG30U1AqIFouUtmggmmYtjgU57kCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAOTFyUPSkAy436Nnb9OmBpXvLkCGoJYdmoV4GgcUWjMxc9OFb2mShbZXVr30UUCF6h/VaYWZA64CPabDmdMstrUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIGo+1fz5BN6DRtGw3EvehHiBg4iHqXXeAUaXxMkm8FL0Mrqpe7G51CPvlvOPnyECxaFNt5adBF7cO2C4cZrr+0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJxzz3hBZxu5YyP5ZGXHWWpCYtMII/7dPVNI3EBUriKAi4uXgl1ewjZSGuV+dfU+IKo1QndQckHzzOcuJmOIE7UCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIEJmq+rs7lJBT/RQ57GY7Wsu5ayfekA8Vu9bwPkfc8yCEYFBPQLIqLCY6HCJfkpetqQmvXnAK7zrJgruMMKOG8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKbHkLxgbZmo8UzMGr5xqgY3P9zAAxIFiWeTjjT8aqL56rKi08Q3IhH0SAvwrwwapd8iYjxW0zD/AD6GRSC9I/kCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJX4Nt6w3Qs+GGC2GFGUxt7pxSQotoscF9MdpqbbaU+s0jyRHyp1G3dvSUtPSz4err822422dU7Grv8KFKpeAGECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKv7RwVZjC5DdeV9zGUlnizMsAF/TV7RlW0oKI1rdFCNKz1O+j8solat3H3KEfn0EEsxQqlzkJyblQr0B4Pv8sUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANnOUNk2iYpRljD+UhrfA0wybgljfSOLqJZpc208nU1+XdHwxzw7+EW9i7OoGmmhkRfD1ocgUJ7Jnd5NOJuykK8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIOasTOlYb4WuFuhaunoNogfd5wBqWThudXGVC6xiYsCsktcmNmLL+bWJooWNk18Den8kxHtdJ0N6M9Zz+B0q0MCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALj73gFUZtQOdf+JHiBJ2wI5RxNTfD4kA+DULGiPotNE1w1GVDFpyfxkymi5MCa2D4er2XSqCMVCRMtvNBkaLPMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALG0dyiihfg4f1ATiPZzvCTA4J+waaj2zI4m7NtX0H2fN8BdKo2eR5PIdhbWafjGJk2BtKQxusEP8Ry8gS3g45UCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIa9oc6qF4nKSKXCANIwoovTGMI/fhPsOqh6J9+AapMGC9OniOzW4dZlJ7TDP7aVcrZgDasYaov1XE9IOF0dwEECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALxk0R2FHHNullUNV+qWC6np9vvBn9Lm7F7isfjz/TnvGHRlQZ9k2E3HsOXDVVtUpaesRJM0ivdKpfq940W/tqUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIYXjmzMpj6hUQz2ZsyZIhJOf73Q290Muj0zzMu5qKImpieBxrt0TomgEvyk7rpnEW8JqQnFwt1e6goo2JeojH0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAOg8hQLdg+698wRwts2N/+QAQvoJndlYimrpaj+cNKgnfICXzqpX4AkINQGV7UziBgOMW35gQX18/Hy0gtGfkmMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALRGpLobvC18DKuV65siseiHgudra17O8/wmf/3OazFbayFB1j9Ai+XDI4AgwPvUQWRZameqvuRcEnfnvCN3gaMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMedAULEQxBd6f7QB3cCPk9PLqmYx/rT9r+D9mkF107vYo0UPE7zkQ/9iT8Scw+oaG9x427OTK26u6sqlbndh8ECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIJ7p3wzq7o60ZdPxaFDYRHzVM9vhugBHWMUYAHefaUumwHV4k2HaQ2Wh2LpZMhHFSWsylZbD6uk74jgPZ1gxAkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIGA4xOA2GBo0CQm5mL1b/+xuBRdNDdCJ82SGFFNs9Ep3JyD1aH7U/DwFrm7aL6xV98Rjb1eKJeqNfNOOH2HROkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMgGwa6GtGs0kFUUpXYOZJHoECaDwzF444PvygLGDOuNFFX+AnI0gBabGHSr+287gcwzU10nJb6NxW4pd6Be3IcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALHHS5NRJbFClT/elRYI3Azu0Vn023EiXOeAUAsiEB10DwwBqaHufbrkskyw4qdKgRZOUPuV8bmVkEdVXkQAhnECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALiaYg0teJZpE80aF+J4ap//oTlX89VH1dh8eLosjKG+lYhdRvNCIWetK30wbtt9hw1+9mrs44k7TH7rAJHA6ksCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMmnE2uLhnNhrTpVI7vkjPo6F092JO+LsE7tQJPEf6SI+BroYRs5P3AVG0QQOpoR9vDNwbGhFmbPkoDEbYjqReMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMB6ydmXDn+Id/2rDGJD7BkASe/OqnpOj6Fn49Vhmv7IOF+SDlkLg4A/OHZ2lQ6fkQoh08GlJ/tciKD7dyGrUrkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIp9Rp6rbkpZHDvchRezkdm4w1ej38U88rAHF0gAn3PANbtxBppca9t/A9zp4sRCdAi8SZPFEU+48kJQBM9AnKUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJ1ERcB6k7jV9C9cX1g74RHv1pMmKKTV/GOyAQqkbnPRmFFfq4N7e8eai4D1TwK5xImnnxZl9hYKDVhP00rjwhsCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJYVZ/fA44F8v6RYOa8vrZKbkiqz0n7R0277PmAzu3pBLv85wzlIWYOsaOR5OonNQeUtc3fVBd+ODTt/nQy47oECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIl9XgEe4y7YOYoo2CEH5LC7vx/H+4WklCC51C8rHItVTEHEZZdD4gQOmHZcnMlqWHomQgf7GEe+9bw/UwjnqGcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIES0VMo8Cu2I4UwUZqs2lyVusb9RnQ3SwOP1GtVFtDbUk38+iK9oayQw7+sPkFnAgsBbioHJm610NAV6mFohXUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALEFzXkFT9eLYO47D/Gca9uzq3qTlKAci6J6br1vevVItJDgdT3ZFwoS1ZM8XLBg+amBQ40RkYzqTN7k20uzW1sCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALV6f2Z/m63BdH5Uc+4BnJFA476IyGdbn6p3GOLiETq9ZsKa/AT7QHu/bHl9G/N2eCVEitkOAlNImLGvyE/4CJMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIjox6VNQ41t5Q4C8C6hqGSbnbfe6R3/5TYEujGx1Sy2A/hgzO+HaA7d2IVQdQN613dG1mmftHPuCKYvvKmy34kCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJxdqZwJ0EjBetUIZlrPPsuLKePjHOcpYOYBM8ShQtQcqc1p0TnlT1rl3NtUDS9g6z4CD7BFhJQIum5o5M2S07cCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJhk2nTGAHyFc6vGMbmu3UpBY9yd1AyPR5BTeDmUxYMqz0i2xdLaMK6+EqfFb5LKcMkIpmsZbHmRlatCv+71LRUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJSKGsNgU8njanfiuOb5PXYWyabHVCIPelNleVnKlOyMs5jW/b9lOALruIKENM5q2J4tK+d6o5u2QqQdAhJ2vZECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKi4z5xqlBtzbDUfACvQOKLa5HiF4MocrXWmvy7Va7jAw6G234tChmIOXxAMdoCb/2lIa6N5XGcy28LdrW5VNh0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMmByIe1Y3xfH4vUirBGKLcXuhx4P0YYgtKrmGtvtKel22K4MBp314/aK+QJQLfjvfeWG1Uw8iSIp4/qeZVqjlECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJhhhKLu3hBOjPIYY5xahry09veyM1fRD2m/TcpTgzD3xh39xpTSoBS6Qkgem3IiTAgQI8TzZFLZphGrVOwnSwECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMOOELNOknFnQXrCz4BkYXEtYPsm0MrC7ORVmVpZNbzBzOEPsQa9Uyf/MQePR5iEtt38UsDdGzfwtg/HkgtcgOMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALGQ307IbFZdQVFYXHgLfLJAwtuZm7sXpZvx0HGXwQ1exg1CLkQ9174kTBjMEOCQl8qg3B2AKzmjxBsLriXHr9kCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAILslgV+Qup2hpglScOc4hEAVKvGEWZiI+iG9WJwaZyhFV/JLfAsA5B0O+fAnlY8KXLtKlDjiIRS6c5NwCT/V08CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIXX0+Ezo7AzycFTlY7UjdFd8TfUBcbnnrz4LBVxvYdA0U9X2w7X8ofMe40RxqYZ3Zl2Ii9N+HENoU4zOns1kHECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMsCO6NEMIbP6ehYH/L3USirxEbj4BnO6v+FJNiyP2bMnRRP5Fl0EHezcy3eq6tr+6LEqdt1Ir7cInO3+/VdkkECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAI1mBp4S9k3WPmJkw8kkGSalIU4bityfhokRVYONjUEkpAmDgdYDD5LsiYsYe475W8bJxc9IcXi7VmuGKMMQVXcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM/utorE6wf1YD2tn2H2SFfRLOeyNEjLy6CEyUi+wdV0vGZCsac6OeSssvndLLvFFA2jTTe08Mfc9DcJsB343O0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIxlqx8TfvNpS+25RvLJ8R/JOqezVXjhCgHjRsPNOoXPE4XOJlO/3rs7GMCsLsnEC02IRknD+Ihj3/ifCQhT+M8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJRf7DGAkw9ka/PvVII+Nq5s+A1CDAdCGqBWSApsVvtUCG7JxpwyvUSc/xYolazMWWofEEQiUHYKfP9Wic7tQZkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKudYI6QYT+bNQQ7AzdBo12UMWVP1X83Qa/G8eopYOLXlXwr1sDKVd0YljCgUadHIRcsi5zz+ekndVW3ukZScdECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAISLq3f6+PucfFy5nqzb43TplwrwIqQZIkXcS8XAtDZ5z+sRAvWPbWwI2/lgARBmrHh4OIIlb/01AnjBvmumzVMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIoBliACo/Q5k6aT4KsV1+RibCb+RoPyftyhdCqc7aSkPoXKF+uA7w3+geaulfWWEb8fHK+BrNPQBxYMqFr1X7cCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIBBYGatmPSAs03gVvRaZl/YLMze5AHKjs5qjBGRNweQyUFnbV5YHvCu0j418y70njNUO6t6hi019oraevvsjlcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIh+JbXdFbY84Yfolz401BkRlq2/aHlBD6jhY5lIRqgx0zHXSTAGcThmkWQ3R/Nr3MdnGALo4wFCV0/7YM08R58CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIHp5ln+XypIFECSbUDp5y+Dxyaw6IaW1v+LJQpDfq6Wa0pXV2IrWSrNdz2L8DxOIlIAKPmuHKEyBPNEjLXI1G8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALgRHpl7QM34AlCagQxeFTTGbZRYaNQLncbmn7zpU2NJPcO9G+MVr8huIhTjNfJGRywuAAkpZfl526CMySf6QqUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALyg32eyvErorWridKvm9t0S/Jnz+5z+Xk36yuHaUH5xyO1GOsnLXVCT/L6cSW8k+FjURgJgT7wG+BCLEhPrDu0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJFDs0c4Y1w54JqbI71NUphuA+3V37RUbOBLAxDuDwtKOJ/hvOISn5M0FVvOBLS5INiV04AC+SFxfGr5jNkHExcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANnrBFtwu1rhMm7KvbkSJDLM+aP9inmnlbok8FVFZqZLdDx6j9NSTWnkepz0NmsBATrUiKpxWltygESI4y7SbwECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJzlXdCyAXIFtXUMAQO0VEYMbnEmS6Grn02jJs7D+0aB/nZ+NWsLHhVNu4vr08hs76PNNUUoznskIQPUAoByHFMCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKQM8yjHQ3Uu1gVSHbV2ljI2/Sz/BsD26QzRGJdzpyre45grdkm5F3Eqbnanl+QH6SFhLK/6V8tK0z/WZDK7WVkCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAINMSo4xeEITnwtvR2LdP5fk8Gh56/TNXdxpmCcNCwqCZTQFyT4UqOBT2HYnskzxNXvAw0EfmUOtVCLTvRhCMG0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIyrkDOeNYW1R9/ipc3jtaVLGxWZsPReTV1fYThnVfYc9iG72Nnmt6EAN4ChAp2kJsyW7QRjK6zDa3KDNLXBJ8ECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKMdGjuW4CkKMjlOwoaTe5TFUhJHyU463VslSY9BKc5Jat/9uCUr7851xx+iuCIpTP5JZTG68h6YbYFYy4SXMq8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKRK1qKgs8BUF+RfuxEBI0ywrvTsvc7oYmwLo9pLlcY56Vwve2Labpj8knnVMyOv041cew1EYnmGL0ZsPmnWFu8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAICe06ikZs1e+QaYmPPYmLh8DcZUSQthCrWz2bGrwDMIUn2HVQhya0dZacD2xxSgT0b2Kl8xouX2oZKvhFJDJJ8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALov7uGubNpdRSpWjfaFQFjDuzjPWAhtyZTSpqehrAmgUqd+N5NDJNNYjkhJob42geUjfPu9MTn/FmC7Jc29lCUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK7p6lz53erEMSH/J2dazk+pJE1cXR7IuVc6yNmIFf6w4vtCoixwHyDdGTlqM2w254TDS0bZ9AgjCnTSZ7FcvK8CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAOXm4dr8U8aXKcB1imevjV6sg26lg5g+UKD/TA17KY+ibeNpQYDLeEr5vuDF0fAe14r+mvAQj5NypW7vMI10+OECAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANrDE5AaKuQor72r//SC4clkX71hStn4VnIvvRchfMSUkVqH+5G82Qx5U2x05IaevLe87PWgGjvKpvFHa0DsuZUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKy54ksZQ7meDUclMzE1Pr/w7bX7bSBvORbUSI7IBcfRuJ0mLbSG4qJaOJ77SM4M9g4QLYU6oxAOXc2h69H5i7sCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIA0L9aTZa1tM1b+JwgrV4AHt9j/vESbaZN1cpmbnQ7srGCmsNjcg2Wwh844WuzXieC0QUCKBAKxwzVWbzr42hcCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIkfnJipNmcv72vrtEy2p+Ees3cxvkpeXrz1Sg/LkDW89c45+A5MaQH8+QdXGP9BQv8pXgA9bBJbWLMnFuh8rsUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIhJBAG/InzZuHR9GIn6uWtq5pNWCeoCl8ZQurXGqJRVizbKULwPbzw7mdGfMCYpVUM5Wp39Klh3E1z11CPcCXsCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKVBDXMv+J7jjItJbP4iV19Df7nilIsaAGq+MLcU14XnBLIcgf3kmCMu++O+/Tvknf4CAgl06yOxczpnr8kywMUCAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK36AiIIQhXe2UTKY/yjxI4eMaTkfFyhTW+Fe7hqPLE4ZWhhgKry5a0pLsLUzY98QyRkGNNl1LDmNhiII1IXav0CAwEAAQ==',
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANjHu3xoTkPOyqYZFk0kYZUOQ5zIMRC+kKzxZbgPTsoRegzKedLDz2tvcyzIcWdDKv+Gjf/aStSyOWdXN6KGc9cCAwEAAQ=='];


// Requirements
const pty = require('node-pty');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const { exit } = require('process');
var exec = require('child_process').exec;

// Express Framework
const init_klineList = require('./origin_data');
const express = require('express');
var app = express();
const bodyParser = require('body-parser');
var request = require('request');
const axios = require('axios');

// Load HTML resources
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.engine('.html', require('ejs').renderFile);

// Load other nodejs files
const RegisterUser = require('./RegisterUser');
const LoginUser = require('./LoginUser');
const QueryToken = require('./queryToken');
const Transfer = require('./transfer');
const QueryOrder = require('./queryOrder');
const CreateOrder = require('./createOrder');
const QueryCommittee = require('./queryCommittee');
const ElectCommittee = require('./electCommittee');
const FormCommittee = require('./formCommittee');
const QueryDealedOrder = require('./queryDealedOrders');
const Report = require('./report');
// import { kLineDataList as GOLD_SLIVER } from '@/public/kline/kline_gold_sliver'
// import { kLineDataList as GOLD_CARBON } from '@/public/kline/kline_gold_carbon'
// const GOLD_SLIVER = require('./public/kline/kline_gold_sliver');
// const GOLD_CARBON = require('./public/kline/kline_gold_carbon');

// Shamir Secret Sharing
const sss = require('shamirs-secret-sharing')
// RSA
const jsrsasign = require('jsrsasign');
const { stringify } = require('querystring');
// 
const spawn = require('child_process').spawn;
// 首次创建订单，启动订单机器人
let firstOrder = true;
// 首次形成委员会，启动委员会客户端
let firstFormCommittee = true;
// 委员会输出
const committeeOutputs = [[], [], []];

let klineData = new Map();

let coin_type_str = ["BTC", "ETH", "LTC", "ATOM", "DCR", "DOGE"]

/* 本地读取区块头数据 
var raw_blockHeader_list = []
for(var i=0; i<raw_blockHeader_list.length; i++){
    let date = new Date();
    date.setTime(raw_blockHeader_list[i].time * 1000);
    var time_data = date.toLocaleString();
    // console.log(time_data.replace(', ','\n'));
    var new_data = {
        version: raw_blockHeader_list[i]["version"],
        type: coin_type_str[raw_blockHeader_list[i]["type"]],
        hashPrevBlock: raw_blockHeader_list[i].hashPrevBlock,
        hashMerkleRoot: raw_blockHeader_list[i].hashMerkleRoot,
        hashBlock: raw_blockHeader_list[i].hashBlock,
        time: time_data.replace(', ','\n'),
        bits: raw_blockHeader_list[i].bits,
        nonce: raw_blockHeader_list[i].nonce,
        height: raw_blockHeader_list[i].height,
        score: raw_blockHeader_list[i].score,
        relayer: raw_blockHeader_list[i].relayer,
        ifConfirm: 'false',
    };
    // console.log(new_data);
    blockHeader_list.push(new_data);
}*/

// 搬运工列表
fs.readFile('json_node.json',(err,data) => {
    nodes = JSON.parse(data)  // 首次获取，从本地文件读取
})

// prices列表
fs.readFile('prices.json',(err,data) => {
    prices = JSON.parse(data)  // 首次获取，从本地文件读取
})

/* Route List */

// Default route
app.get('/', function (req, res) {
    res.render(__dirname + "/" + "public/index.html");
})

// BlockHeader 20220719
app.get('/putBlockHeader', async function (req, res) {
    var incomingBlock = JSON.parse(req.query.data);
    let date = new Date();
    date.setTime(incomingBlock.time * 1000);
    var time_data = date.toLocaleString();
    // console.log(time_data.replace(', ','\n'));
    var new_data = {
        version: incomingBlock["version"],
        type: coin_type_str[incomingBlock["type"]],
        hashPrevBlock: incomingBlock.hashPrevBlock,
        hashMerkleRoot: incomingBlock.hashMerkleRoot,
        hashBlock: incomingBlock.hashBlock,
        time: time_data.replace(', ','\n'),
        bits: incomingBlock.bits,
        nonce: incomingBlock.nonce,
        height: incomingBlock.height,
        score: incomingBlock.score,
        relayer: incomingBlock.relayer,
        ifConfirm: 'false',
    };
    // console.log(new_data);
    var index = node_name.indexOf(new_data.relayer)
    nodes[index].carryNumber += 1;

    /* 只取最新十条数据 */
    if(blockHeader_list.length === 10){
        blockHeader_list.shift();
        blockHeader_list.push(new_data);
    }
    else blockHeader_list.push(new_data);

    // blockHeader_list.push(new_data)
    res.json({
        'status':'success',
    })
})

app.post('/getBlockHeader', async function (req, res) {
    // console.log(blockHeader_list);
    res.json({
        'blockHeaderList': blockHeader_list,
    })
})

// GetNodeList 20220719
app.get('/getNodeList', async function (req, res) {
    fs.readFile('json_node.json',(err,data) => {
        nodes = JSON.parse(data)  // 首次获取，从本地文件读取
    })
    res.json({
        'nodeList': nodes
    })
})

// UpdateCarryNumber 20220719
app.get('/putCarryNum', async function (req, res) {
    var incomingNum = JSON.parse(req.query.data);
    var index = incomingNum.nodeID;  // 搬运工下标
    var num = incomingNum.carryNumber;  // 更新后的carryNumber
    nodes[index].carryNumber = num;
    res.json({
        'status': 'success',
    })
})

app.post('/updateCarryNum', async function (req, res){
    /* 随机增长 
    var r = Math.ceil(Math.random() * 40);
    nodes[r].carryNumber += Math.ceil(Math.random() * 3); */
    res.json({
        'nodeList': nodes
    })
})

// Update Order & DealedOrder Data 20220719
app.get('/putOrder', async function (req, res) {
    var incomingOrder = JSON.parse(req.query.data);
    var rsaKeypair = jsrsasign.KEYUTIL.generateKeypair("RSA", 512);
    var pub = jsrsasign.KEYUTIL.getPEM(rsaKeypair.pubKeyObj);
    if (incomingOrder.item === 'Tether') {
        console.log('ERROR');
    }
    else {
        // for each committee, encrypt their shares
        var committeeName = ['Steve','Morgan','Orville']
        var encrypted_share = [];
        for (let i = 0; i < 3; i++) {
            let cmt_name = committeeName[i];
            let pub_i = pub;
            for (let j = 0; j < 2; j++){
                incomingOrder.shares[cmt_name][j] = jsrsasign.KJUR.crypto.Cipher.encrypt(incomingOrder.shares[cmt_name][j].toString(), jsrsasign.KEYUTIL.getKey(pub_i));
                encrypted_share.push({
                    data: incomingOrder.shares[cmt_name][j],
                    name: cmt_name,
                    seq: j.toString(),
                })
            }          
        }
        incomingOrder.shares = encrypted_share;
    }
    let date = new Date();
    date.setTime(incomingOrder.create_time * 1000);
    var time_data = date.toLocaleString();
    incomingOrder.create_time = time_data.replace(', ','\n');
    
    /* 只取最新十条数据 */
    if(orders.length === 10){
        orders.shift();
        orders.push(incomingOrder);
    }
    else orders.push(incomingOrder);

    // orders.push(incomingOrder)
    res.json({
        'status': 'success'
    })
})

app.get('/updateOrder', async function (req, res) {
    res.json({
        'OrderList': orders
    })
})

app.get('/putDealedOrder', async function (req, res) {
    var incomingDealedOrder = JSON.parse(req.query.data);
    var bo = [];
    // Time Translation
    let date = new Date();
    date.setTime(incomingDealedOrder.buy_order.create_time * 1000);
    var time_data = date.toLocaleString();
    incomingDealedOrder.buy_order.create_time = time_data.replace(', ','\n');
    bo.push(incomingDealedOrder.buy_order)
    var so = [];
    // Time Translation
    date = new Date();
    date.setTime(incomingDealedOrder.sell_order.create_time * 1000);
    var time_data = date.toLocaleString();
    incomingDealedOrder.sell_order.create_time = time_data.replace(', ','\n');
    so.push(incomingDealedOrder.sell_order)
    incomingDealedOrder.buy_order = bo;
    incomingDealedOrder.sell_order = so;
    incomingDealedOrder.related_comm = ['Steve', 'Morgan', 'Orville'];
    // Time Translation
    date = new Date();
    date.setTime(incomingDealedOrder.deal_time * 1000);
    var time_data = date.toLocaleString();
    incomingDealedOrder.deal_time = time_data.replace(', ','\n');
    fee[incomingDealedOrder.item].f += incomingDealedOrder.fee;
    fee[incomingDealedOrder.item].blockNumber += 1;
    //console.log(incomingDealedOrder);
    //console.log(fee);

    /* 只取最新十条数据 */
    if(dealedOrders.length === 10){
        dealedOrders.shift();
        dealedOrders.push(incomingDealedOrder);
    }
    else dealedOrders.push(incomingDealedOrder);

    //dealedOrders.push(incomingDealedOrder);
    res.json({
        'status': 'success'
    })
})

app.get('/updateDealedOrder', async function (req, res) {
    res.json({
        'DealedOrderList': dealedOrders
    })
})

// Update Chart Option 20220720
app.get('/updateChart', async function (req, res) {
    res.json(fee);
})

// Return Address/PubKey 20220718
app.get('/getAddr', async function (req, res) {
    var r = Math.ceil(Math.random() * 10000);
    var addr = await RegisterUser.RegUser('user'+ r.toString());
    node_list.push(addr);
    console.log(node_list);
    res.json({
        'address': addr,
    })
})

// Update TokenPriceList 20220718
app.post('/update_priceList', async function (req, res) {
    var tokenList = ['btc','eth','ltc','doge','ada','atom','dcr'];
    var priceList = req.body.priceList;
    
    // 20220718 Front
    // Take token name and apikey as input
    var apikey = 'GLM8OEWHKAbglvtfH97v';
    for (var index = 0; index < tokenList.length; index++) {
        var price_info_url = 'https://services.tokenview.com/vipapi/coin/marketInfo/' + tokenList[index] + '?apikey=' + apikey;
        // console.log(price_info_url);
        var token_info = {};
        await axios.get(price_info_url).then(Response => {
            token_info = Response['data'].data;
        })
        // console.log(token_info);
        priceList[tokenList[index]].price = token_info.priceUsd;
        priceList[tokenList[index]].isup = token_info.changeUsd1h>0;
        priceList[tokenList[index]].rate = token_info.changeUsd1h;
    }
    res.json({
        'priceList': priceList,
    })
})

// 初始化k线图
app.post('/init_kline', function (req, res) {
    let ret_klineList = init_klineList.init_kline_chart.concat(Array.from(klineData.values()));// Array.from(klineData.values());
    // ret_klineList.sort(function (a, b) { return a.timestamp - b.timestamp; });
    let ret_klineList_rev = [...ret_klineList];
    ret_klineList_rev.reverse();

    res.json({
        'init_klineList': ret_klineList,
        'init_klineList_rev': ret_klineList_rev,
    });
    /*
    if (req.body.GOLD_SLIVER) {
        var ret_klineList = [];
        var ret_klineList_rev = [];
        var init_klineList = GOLD_SLIVER.init_kline_chart;
        for (var index = 0; index < init_klineList.length; index++) {
            var cur_k = {};
            cur_k['timestamp'] = new Date(init_klineList[index][0]).getTime();
            cur_k['timestr'] = new Date(init_klineList[index][0]).toLocaleString();
            cur_k['open'] = +init_klineList[index][1];
            cur_k['high'] = +init_klineList[index][2];
            cur_k['low'] = +init_klineList[index][3];
            cur_k['close'] = +init_klineList[index][4];
            cur_k['volume'] = Math.ceil(+init_klineList[index][5]);
            ret_klineList.push(cur_k);
            ret_klineList_rev.unshift(cur_k);
        }
        res.json({
            'init_klineList': ret_klineList,
            'init_klineList_rev': ret_klineList_rev,
        })
    }
    else if (req.body.GOLD_CARBON) {
        var ret_klineList = [];
        var ret_klineList_rev = [];
        var init_klineList = GOLD_CARBON.init_kline_chart;
        for (var index = 0; index < init_klineList.length; index++) {
            var cur_k = {};
            cur_k['timestamp'] = new Date(init_klineList[index][0]).getTime();
            cur_k['timestr'] = new Date(init_klineList[index][0]).toLocaleString();
            cur_k['open'] = +init_klineList[index][1];
            cur_k['high'] = +init_klineList[index][2];
            cur_k['low'] = +init_klineList[index][3];
            cur_k['close'] = +init_klineList[index][4];
            cur_k['volume'] = Math.ceil(+init_klineList[index][5]);
            ret_klineList.push(cur_k);
            ret_klineList_rev.unshift(cur_k);
        }
        res.json({
            'init_klineList': ret_klineList,
            'init_klineList_rev': ret_klineList_rev,
        })
    }*/
})

// 更新k线图
app.post('/query_new_value', function (req, res) {
    let old_value = req.body.old_value;
    if (!old_value) {
        res.json({
            'new_value': null
        });
        return;
    } else {
        let timeStamp = old_value.timestamp;
        for (let v of klineData.values()) {
            if (v.timestamp > timeStamp) {
                res.json({
                    'new_value': v
                });
                return;
            }
        }
        res.json({
            'new_value': null
        })
    }

    /*
        var flag1 = (Math.random() - 0.5) >= 0;
        if (flag1) var open = old_value.open + Math.random() * 10;
        else var open = old_value.open - Math.random() * 10;
    
        var flag2 = (Math.random() - 0.5) >= 0;
        if (flag2) var close = open + Math.random() * 10;
        else var close = open - Math.random() * 10;
    
        var high = Math.max(open, close) + Math.random() * 5;
        var low = Math.min(open, close) - Math.random() * 5;
    
        res.json({
            'new_value': {
                timestamp: new Date().getTime(),
                timestr: new Date().toLocaleString(),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: Math.ceil(Math.random() * 10),
            }
        })
    */
})

// Query Block
app.post('/query_block', function (req, res) {
    // let begin = req.body.begin;
    // let end = Math.max(begin + 100, block_list.length);
    let num = req.body.num;
    if (num === 'all') {
        num = block_list.length;
    }

    num = block_list.length;

    res.json({
        'block_list': block_list.slice(0, num)// block_list.sort(function (a, b) { return b.blockNumber - a.blockNumber }),
    });
})

// login
app.get('/login', function (req, res) {
    res.render(__dirname + "/" + "public/login.html");
})

app.post('/login', async function (req, res) {
    console.log(req.body.username)
    var login_status = await LoginUser.LoginUser(req.body.username)
    if (login_status == 'LOG_SUC') {
        res.render(__dirname + "/" + "public/main.html", { username: req.body.username });
    }
    else if (login_status == 'LOG_ERR') {
        res.render(__dirname + "/" + "public/login.html");
    }
})

// register
app.get('/register', function (req, res) {
    res.render(__dirname + "/" + "public/register.html", { msg: '' });
})

app.post('/register', async function (req, res) {
    var username;
    if(JSON.stringify(req.body) == '{}') {
        username = req.query.username;
    } else {
        username = req.body.username;
    }
    var reg_status = await RegisterUser.RegUser(username);
    // Register successfully
    if (reg_status == 'REG_SUC') {
        // console.log(reg_status);
        res.render(__dirname + "/" + "public/login.html", { msg: '注册成功' });
    }
    // Already registered
    else if (reg_status == 'REG_ARD') {
        res.render(__dirname + "/" + "public/register.html", { msg: '已经注册过此用户，可直接登录' });
    }
    // Register failed
    else res.render(__dirname + "/" + "public/register.html", { msg: '注册失败' });
})

// Query Account Info
app.post('/getinfo', async function (req, res) {

    var username;
    if(JSON.stringify(req.body) == '{}') {
        username = req.query.username;
    } else {
        username = req.body.username;
    }
    (async function () {
        try {
            await QueryToken.QueryBalance(username).then(result => {
                console.log('Queryapp program complete.');
                res.json({
                    'userinfo': result,
                });
            });
        } catch(e) {
            console.log('Queryapp program exception.');
            // console.log(e);
            // console.log(e.stack);
            res.json({
                'userinfo': 'Not Found',
            });
            // process.exit(-1);
        }
    })();
})

// Form Committee
app.post('/formcommittee', async function (req, res) {
    await FormCommittee.FormCommittee().then(result => {
        res.json({
            'status': result,
        })
    })
    if (firstFormCommittee) {
        let names = ["Steve", "Morgan", "Orville", "Tara", "Luna"]
        for (let i = 0; i < 3; i++) {
            let child = pty.spawn('bash', ['-c', `cd /root/darkpool/darkpool_dev/committeeApp && node client.js ${names[i]}`], {
                name: 'xterm-color',
                cols: 120,
                rows: 30,
                cwd: process.env.HOME,
                env: process.env
            });

            /*
            let child = spawn('bash', ['-c', `cd /root/darkpool/darkpool_dev/committeeApp && node client.js ${names[i]}`]);
            */
            console.log(`Client ${i} created!`);
            // 记录终端输出
            child.on('data', function (data) {
                // console.log(`data for ${i}: ${data}`);
                committeeOutputs[i].push(data.toString());
            });
        }
        firstFormCommittee = false;
    }
})

// Query Transfer Info
app.get('/transfer', async function (req, res) {
    res.json({
        'transfer_list': transfer_list
    });
})

// Query Committee output
app.post('/committeeoutput', async function (req, res) {
    // current data version
    // console.log(req.body.current);
    let current = req.body.current;
    let newData = [];
    for (let [i, data] of committeeOutputs.entries()) {
        // console.log('data:', data, 'i:', i)
        newData.push(data.slice(current[i]));
    }
    res.json({
        'status': true,
        'newData': newData
    });
});


// Transfer to Others
app.post('/transfer', async function (req, res) {
    await Transfer.transfer(req.body.from, req.body.to, req.body.item, req.body.amount).then(ret => {
        res.json({ 'status': ret });
    })
})

// Create Order
app.post('/createorder', async function (req, res) {
    let username = req.body.username;
    let type = req.body.type;
    let amount = req.body.amount;
    let price = req.body.price;
    let item = req.body.item;
    let json_shares = {};
    // Get committees' PubKey
    let PubKeys = await QueryCommittee.queryCommittee(username);
    // console.log('PubKey:',PubKeys);
    let n = PubKeys['committee'].length;
    if (n === 0 || item === 'Tether') {
        res.json({
            'status': 'NoCommittee',
        });
        return;
    }
    else {
        let t = 3;
        // Shamir Secret Sharing
        // console.log('order price:',price);
        // use Python script sss.py for generating shares
        exec('python3 /root/darkpool/Simple_SSS/sss.py ' + price + ' '+ t + ' '+ n, async function (error, stdout, stderr) {
            if(error){
                console.error('error: ' + error);
                return;
            }
            // convert it to json
            var shares = JSON.parse(stdout);
            // console.log(shares);
            // 20220720 write down plaintext price and shares
            var plainshares = [];

            // for each committee, encrypt their shares
            for (let i = 0; i < n; i++) {
                let cmt_name = PubKeys['committee'][i]['name'];
                let pub_i = PubKeys['committee'][i]['pub'];
                let enc_i = [];
                // each share has two value, encrypt them both
                for (let j = 0; j < 2; j++) {
                    // 20220720 第i个委员两个坐标
                    plainshares.push({
                        data: shares[i][j],
                        name: cmt_name,
                        seq: j,
                    })
                    enc_i[j] = jsrsasign.KJUR.crypto.Cipher.encrypt(shares[i][j].toString(), jsrsasign.KEYUTIL.getKey(pub_i));
                }
                json_shares[cmt_name] = enc_i;
            }

            prices.push({
                'price': price,
                'plainshares': plainshares,
            })
            fs.writeFileSync('prices.json',JSON.stringify(prices));

            // console.log(json_shares)
            let ret;
            while (!(ret = await CreateOrder.createOrder(username, type, amount, item, JSON.stringify(json_shares)))) {
                console.log('Retrying............');
            }
            res.json({
                'status': ret,
            })
        });
    }
    /*
    // cd /root/darkpool/darkpool_dev/userApp && nohup node autoCreateOrder.js &
    if (firstOrder) {
        spawn('bash', ['-c', 'cd /root/darkpool/darkpool_dev/userApp && nohup node autoCreateOrder.js &']);
        firstOrder = false;
    }*/
    /*
    .then(ret => {

    })
     */
})

// Query Order Info
app.post('/getorder', async function (req, res) {
    await QueryOrder.queryOrder(req.body.username).then(result => {
        console.log('Queryapp program complete.');

        // 20220719
        for(var i=0; i<result.OrderList.length; i++){
            result.OrderList[i].creator_addr.replace('\r\n','');
            result.OrderList[i].creator_addr = result.OrderList[i].creator_addr.substring(27,158);
        }
        
        res.json(result);
    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Query Dealed Order Info
app.post('/getdealedorder', async function (req, res) {
    await QueryDealedOrder.queryDealedOrder(req.body.username).then(result => {

        // 20220719
        for(var i=0; i<result.DealedOrderList.length; i++){
            var dp = result.DealedOrderList[i].deal_price;
            var sum = 0;
            for(var j=0; j<result.DealedOrderList[i].buy_order.length; j++){
                result.DealedOrderList[i].buy_order[j].creator_addr.replace('\r\n','');
                result.DealedOrderList[i].buy_order[j].creator_addr = result.DealedOrderList[i].buy_order[j].creator_addr.substring(27,158);
                result.DealedOrderList[i].buy_order[j].price = prices[result.DealedOrderList[i].buy_order[j].order_id].price;
                result.DealedOrderList[i].buy_order[j].shares = prices[result.DealedOrderList[i].buy_order[j].order_id].plainshares;
                sum += result.DealedOrderList[i].buy_order[j].amount * dp;
            }
            for(var j=0; j<result.DealedOrderList[i].sell_order.length; j++){
                result.DealedOrderList[i].sell_order[j].creator_addr.replace('\r\n','');
                result.DealedOrderList[i].sell_order[j].creator_addr = result.DealedOrderList[i].sell_order[j].creator_addr.substring(27,158);
                result.DealedOrderList[i].sell_order[j].price = prices[result.DealedOrderList[i].sell_order[j].order_id].price;
                result.DealedOrderList[i].sell_order[j].shares = prices[result.DealedOrderList[i].sell_order[j].order_id].plainshares;
                sum += result.DealedOrderList[i].sell_order[j].amount * dp;
            }
            result.DealedOrderList[i].fee = sum * 0.0005;
        }
        res.json(result);

    }).catch((e) => {
        console.log('Queryapp program exception.');
        console.log(e);
        console.log(e.stack);
        process.exit(-1);
    });
})

// Query Committee
app.post('/queryCommittee', async function (req, res) {
    await QueryCommittee.queryCommittee(req.body.username).then(ret => {
        res.json({
            'candidates': ret.candidates,
            'committee': ret.committee,
        })
    })
})

// Elect Committee
app.post('/electCommittee', async function (req, res) {
    await ElectCommittee.electCommittee(req.body.username, req.body.amount).then(ret => {
        res.json({
            'status': ret,
        })
    })
})

// Report
app.post('/report', async function (req, res) {
    await Report.report(req.body.report_form.username, req.body.report_form.type, req.body.report_form.order_id, req.body.report_form.price, req.body.report_form.deal_order_id).then(ret => {
        // console.log(ret);
        res.json({
            'status': true,
            'result': ret
        })
    })
})


async function orderEventHandler(event) {
    let eventJson = JSON.parse(event.payload.toString());

    if (event.eventName === "OrderDeal") { // To be modified...
        // console.log(eventJson);
        let timeStamp = parseInt(eventJson.time['seconds']);

        if (klineData.get(timeStamp / 60)) {
            let data = klineData.get(timeStamp / 60);
            data.close = eventJson.price;
            data.high = Math.max(eventJson.price, data.high);
            data.low = Math.min(eventJson.price, data.low);
            data.volume += eventJson.amount;

        } else {
            let date = new Date();
            date.setTime(timeStamp * 1000);

            let data = {
                timestamp: timeStamp * 1000,
                timestr: date.toLocaleString(),
                open: eventJson.price,
                volume: eventJson.amount
            }
            if (Math.random() > 0.6) {
                data.close = Math.ceil(eventJson.price + 5 * Math.random());
            } else {
                data.close = Math.ceil(eventJson.price - 5 * Math.random());
            }
            data.high = Math.ceil(Math.max(data.open, data.close) + 2 * Math.random());
            data.low = Math.ceil(Math.min(data.open, data.close) - 2 * Math.random());


            klineData.set(timeStamp / 60, data);
        }
    }
}

// SERVER LISTENING
var server = app.listen(80, async function () {

    // Get history transfer record and listen on new transfer
    const wallet = await Wallets.newFileSystemWallet(process.cwd() + '/wallet');
    const gateway = new Gateway();
    // Specify userName for network access
    const userName = 'admin';
    let connectionProfile = yaml.safeLoad(fs.readFileSync('../organization/darkpool/gateway/connection-org2.yaml', 'utf8'));
    let connectionOptions = {
        identity: userName,
        wallet: wallet,
        discovery: { enabled: true, asLocalhost: true }
    };
    console.log('Connect to Fabric gateway.');
    await gateway.connect(connectionProfile, connectionOptions);
    console.log('Use network channel: mychannel.');
    const network = await gateway.getNetwork('mychannel');
    const tokenContract = await network.getContract('tokenContract', 'Token');
    await tokenContract.addContractListener((event) => {
        // convert into JSON
        var evt = JSON.parse(event.payload);
        // console.log(evt);
        /*
        // Event Name
        var event_name = event.eventName;
        evt['event_name'] = event_name;
        */
        // From, neglect mint
        if (evt['from'] != '0x0') {
            var fromuser_start = evt['from'].search('CN=') + 3;
            var fromuser_end = evt['from'].search('C=') - 3;
            evt['from'] = evt['from'].substring(fromuser_start, fromuser_end);
        }
        // To
        var touser_start = evt['to'].search('CN=') + 3;
        var touser_end = evt['to'].search('C=') - 3;
        evt['to'] = evt['to'].substring(touser_start, touser_end);
        // Value
        transfer_list.push(evt);  // Add to global variable
    }, { startBlock: 0 });  // From genesis block

    const orderContract = network.getContract('orderContract', 'Order');
    await orderContract.addContractListener(orderEventHandler, { startBlock: 0 });

    const listener = async (event) => {
        // Handle block event
        // let type = event.blockData.data.data[0].payload.header.channel_header.typeString;
        //if(JSON.stringify(event).indexOf('action') !== -1) {
        //    console.log(JSON.stringify());
        //    process.exit(1);
        //}
        // console.log(`Block number: ${event.blockNumber}.`);

        //if (event.blockData.data.data.length > 1) {
        //    console.log(event.blockData.data.data[1].payload.data.actions[0].payload.action.proposal_response_payload.extension.events);
        // console.log(event.blockData.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.events);
        //}
        // console.log(event)


        var cur_block = {};
        cur_block['events'] = [];
        cur_block['blockNumber'] = parseInt(event.blockNumber);
        cur_block['header'] = {};
        cur_block['header']['number'] = parseInt(event.blockData.header.number);
        cur_block['header']['previous_hash'] = event.blockData.header.previous_hash.toString('hex');
        cur_block['header']['data_hash'] = event.blockData.header.data_hash.toString('hex');
        cur_block['data'] = {};
        cur_block['data']['signature'] = event.blockData.data.data[0].signature.toString('hex');
        cur_block['data']['payload'] = event.blockData.data.data[0].payload;
        cur_block['data']['payload']['header']['channel_header']['extension'] = event.blockData.data.data[0].payload.header.channel_header.extension.toString('hex');
        //cur_block['data']['payload']['header']['signature_header']['creator']['id_bytes'] = event.blockData.data.data[0].payload['header']['signature_header']['creator']['id_bytes'].toString('hex');
        cur_block['data']['payload']['header']['signature_header']['nonce'] = event.blockData.data.data[0].payload['header']['signature_header']['nonce'].toString('hex');
        cur_block['data']['payload']['data'] = event.blockData.data.data[0].payload.data;
        // Listener may remove itself if desired
        //if (event.blockNumber.equals(endBlock)) {
        //    network.removeBlockListener(listener);
        //}
        //console.log(cur_block['data']['payload']['data']['actions'][0]['payload']['action']['proposal_response_payload']['extension'])
        if (cur_block['data']['payload']['data']['actions'] != undefined) {
            cur_block['endorser'] = [];
            for (var i = 0; i < cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'].length; i++) {
                cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'] = cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'].toString('hex');
                cur_block['endorser'].push({
                    'mspid': cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['endorser']['mspid'],
                    'signature': cur_block['data']['payload']['data']['actions'][0]['payload']['action']['endorsements'][i]['signature'],
                })
            }
        }

        for (let data of event.blockData.data.data) {
            if (data.payload.data.actions) {
                for (let action of data.payload.data.actions) {
                    let _event = action.payload.action.proposal_response_payload.extension.events;
                    if (_event.event_name !== "") {
                        let payload = JSON.parse(_event.payload.toString());
                        /* 20220718
                        if (_event.event_name === 'NewOrder') {
                            payload.item = payload.item === 'Bitcoin' ? 'Gold' : 'Carbon';
                        }*/
                        cur_block['events'].push({
                            name: _event.event_name,
                            payload: JSON.stringify(payload, null, 4)
                        });
                    }
                    // let payload = 
                    // console.log(action.payload.action.proposal_response_payload.extension.events.payload.toString());
                }
            }
        }
        cur_block.display_more = false;
        cur_block.show_events = false;

        if (cur_block['events'].length > 1) {
            // console.log(cur_block['events']);
        }

        block_list.push(cur_block);
    }
    const options = {
        startBlock: 0
    };
    await network.addBlockListener(listener, options);

    //var host = server.address().address
    var port = server.address().port
    console.log("Web Application Address: http://localhost:%s", port)
})
